
from sqlalchemy import Boolean, Column, Integer, String, Date
from datetime import date
from .database import Base

class Americana(Base):
    __tablename__ = "americanas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(Date, default=date.today)
    category = Column(String)
    max_pairs = Column(Integer)
    status = Column(String, default="open") # open, in_progress, finished

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    level = Column(String) # e.g., 3.5, 4.0, PRO
    matches_played = Column(Integer, default=0)
    win_rate = Column(Integer, default=0) # Percentage 0-100
    email = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True) 
    password = Column(String) 
    role = Column(String, default="player") 
    # Professional Profile
    play_preference = Column(String, default="indifferent") # individual, couple, indifferent
    category_preference = Column(String, default="mixed") # mixed, male, female
    category_preference = Column(String, default="mixed") # mixed, male, female
    self_rate_level = Column(String, default="3.5") # Using String to keep flexible "3.5", "4.0+"
    status = Column(String, default="pending") # pending, active, blocked


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    americana_id = Column(Integer, index=True) # ForeignKey relationship implied
    round = Column(Integer)
    court = Column(Integer)
    
    # Players (Store Names or IDs - for simplicity in this MVP we might just store names if IDs are complex to join, 
    # but IDs are better. Let's use IDs but simple integers)
    player_1_id = Column(Integer)
    player_2_id = Column(Integer)
    player_3_id = Column(Integer)
    player_4_id = Column(Integer)

    # Names for caching display without joins
    team_a_names = Column(String) 
    team_b_names = Column(String)

    score_a = Column(Integer, default=0)
    score_b = Column(Integer, default=0)
    status = Column(String, default="scheduled") # scheduled, live, finished


