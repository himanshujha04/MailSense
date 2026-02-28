from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, init_db
from .api_routes import router

# Initialize SQLite database
init_db()

app = FastAPI(title="MailSense AI MVP")

# Add CORS so React frontend can easily query it locally
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "MailSense AI API is running."}
