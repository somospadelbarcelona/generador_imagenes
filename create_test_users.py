import sys
sys.path.append('.')

from api import models, database

print("Creating database tables...")
models.Base.metadata.create_all(bind=database.engine)
print("Tables created successfully!")

# Create database session
db = database.SessionLocal()

try:
    # Create Admin user
    admin = models.Player(
        name="Alex Coscolin",
        phone="649219350",
        password="JARABA",
        role="admin",
        level="PRO",
        status="active",
        matches_played=0,
        win_rate=0,
        self_rate_level="PRO",
        play_preference="indifferent",
        category_preference="mixed"
    )
    db.add(admin)
    print("Admin CREATED: Alex Coscolin / 649219350 / JARABA")
    
    # Create Test user
    test_user = models.Player(
        name="Sergio Test",
        phone="649219351",
        password="SERGIO21",
        role="player",
        level="INTERMEDIATE",
        status="active",
        matches_played=0,
        win_rate=0,
        self_rate_level="INTERMEDIATE",
        play_preference="competitive",
        category_preference="male"
    )
    db.add(test_user)
    print("Test User CREATED: Sergio Test / 649219351 / SERGIO21")
    
    db.commit()
    print("\nDatabase updated successfully!")
    
    # Verify users exist
    all_users = db.query(models.Player).all()
    print(f"\nTotal users in database: {len(all_users)}")
    for user in all_users:
        print(f"  - {user.name} ({user.phone}) - Role: {user.role}, Status: {user.status}")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
