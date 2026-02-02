from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import os
from passlib.context import CryptContext
from . import models, database

# Password security context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Create tables automatically
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="public"), name="static")
app.mount("/js", StaticFiles(directory="public/js"), name="js")
app.mount("/css", StaticFiles(directory="public/css"), name="css")

@app.get("/admin")
async def read_admin():
    return FileResponse('public/admin.html') 

# --- Pydantic Schemas ---
class AmericanaBase(BaseModel):
    name: str
    date: str 
    category: str
    maxPairs: int 

class AmericanaCreate(AmericanaBase):
    pass

class Americana(AmericanaBase):
    id: int
    status: str
    
    class Config:
        orm_mode = True

class PlayerBase(BaseModel):
    name: str
    level: str
    email: Optional[str] = None
    phone: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    matches_played: int
    win_rate: int
    status: str

    class Config:
        orm_mode = True

class MatchBase(BaseModel):
    americana_id: int
    round: int
    court: int
    team_a_names: str
    team_b_names: str
    score_a: int
    score_b: int
    status: str

class MatchCreate(MatchBase):
    pass

class Match(MatchBase):
    id: int
    
    class Config:
        orm_mode = True

# --- Dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Routes ---

@app.get("/")
async def read_index():
    return FileResponse(os.path.join("public", "index.html"))

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Americanas CRM API is running with SQLite Persistence"}

# Americanas endpoints
@app.get("/api/americanas", response_model=List[Americana])
def read_americanas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    americanas = db.query(models.Americana).offset(skip).limit(limit).all()
    result = []
    for a in americanas:
        result.append(Americana(
            id=a.id,
            name=a.name,
            date=a.date.isoformat(),
            category=a.category,
            maxPairs=a.max_pairs,
            status=a.status
        ))
    return result

@app.post("/api/americanas", response_model=Americana)
def create_americana(americana: AmericanaCreate, db: Session = Depends(get_db)):
    try:
        date_obj = datetime.strptime(americana.date, "%Y-%m-%d").date()
    except ValueError:
        date_obj = date.today()

    db_americana = models.Americana(
        name=americana.name,
        date=date_obj,
        category=americana.category,
        max_pairs=americana.maxPairs,
        status="open"
    )
    db.add(db_americana)
    db.commit()
    db.refresh(db_americana)
    
    return Americana(
        id=db_americana.id,
        name=db_americana.name,
        date=db_americana.date.isoformat(),
        category=db_americana.category,
        maxPairs=db_americana.max_pairs,
        status=db_americana.status
    )

# Players endpoints
@app.get("/api/players", response_model=List[Player])
def read_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Player).offset(skip).limit(limit).all()

@app.post("/api/players", response_model=Player)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    db_player = models.Player(
        name=player.name,
        level=player.level,
        email=player.email,
        phone=player.phone
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

# Matches Endpoints
@app.get("/api/matches", response_model=List[Match])
def read_matches(americana_id: int, db: Session = Depends(get_db)):
    return db.query(models.Match).filter(models.Match.americana_id == americana_id).all()

@app.post("/api/matches/generate/{americana_id}")
def generate_matches(americana_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Match).filter(models.Match.americana_id == americana_id).first()
    if existing:
        return {"message": "Matches already exist"}
    
    matches = []
    for i in range(1, 4): # Create a few sample matches
        m = models.Match(
            americana_id=americana_id,
            round=1,
            court=i,
            team_a_names=f"Pareja A{i}",
            team_b_names=f"Pareja B{i}",
            score_a=0,
            score_b=0,
            status="scheduled"
        )
        db.add(m)
        matches.append(m)
    db.commit()
    return {"message": "Matches generated", "count": len(matches)}

@app.put("/api/matches/{match_id}")
def update_match(match_id: int, match_data: MatchCreate, db: Session = Depends(get_db)):
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    db_match.score_a = match_data.score_a
    db_match.score_b = match_data.score_b
    db_match.status = match_data.status
    db_match.court = match_data.court
    
    db.commit()
    return db_match

# --- Auth Enpoints ---

class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str
    self_rate_level: str
    play_preference: str
    category_preference: str

class LoginRequest(BaseModel):
    phone: str
    password: str

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Robust Admin Upsert
        admin_phone = "649219350"
        admin = db.query(models.Player).filter(models.Player.phone == admin_phone).first()
        
        if admin:
            # Update credentials if exists
            admin.name = "Alex Coscolin"
            # SECURITY: Auto-hash legacy plain text password if detected
            if admin.password == "NOA21" or admin.password == "JARABA":
                admin.password = get_password_hash("NOA21")
            
            admin.role = "admin"
            admin.status = "active"
            print(f"🔄 Universal Admin SECURED: {admin.name} / {admin_phone}")
        else:
            # Create if not exists with hashed password
            new_admin = models.Player(
                name="Alex Coscolin",
                phone=admin_phone,
                password=get_password_hash("NOA21"), 
                role="admin",
                level="PRO",
                status="active",
                matches_played=0,
                win_rate=0,
                self_rate_level="PRO",
                play_preference="indifferent",
                category_preference="mixed"
            )
            db.add(new_admin)
            print(f"✅ Universal Admin CREATED & SECURED: Alex Coscolin / {admin_phone}")
        
        db.commit()
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

@app.post("/api/register", response_model=Player)
def register(user: RegisterRequest, db: Session = Depends(get_db)):
    # Check existing
    existing = db.query(models.Player).filter(models.Player.phone == user.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="El teléfono ya está registrado")
    
    # Create Player
    role = "admin" if user.phone == "649219350" else "player"
    initial_status = "active" if role == "admin" else "pending"
    
    new_user = models.Player(
        name=user.name,
        phone=user.phone,
        password=get_password_hash(user.password), 
        role=role,
        level=user.self_rate_level,
        self_rate_level=user.self_rate_level,
        play_preference=user.play_preference,
        category_preference=user.category_preference,
        matches_played=0,
        win_rate=0,
        status=initial_status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    print(f"Login attempt: {creds.phone}")
    user = db.query(models.Player).filter(models.Player.phone == creds.phone).first()
    
    if not user:
        print("User not found")
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    
    if not verify_password(creds.password, user.password):
        print("Password mismatch")
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    
    if user.status != "active":
        print(f"Status pending: {user.status}")
        raise HTTPException(status_code=403, detail="Tu cuenta está pendiente de validación por un administrador.")
    
    return user

@app.put("/api/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Player).filter(models.Player.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.status = "active"
    db.commit()
    return {"message": "Usuario activado"}

@app.get("/api/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.Player).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
