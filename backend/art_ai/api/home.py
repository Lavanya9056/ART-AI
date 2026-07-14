from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/", response_class=HTMLResponse)
def home():
    return """
    <html>
      <head>
        <title>ART-AI</title>
        <meta charset=\"utf-8\" />
        <style>
          :root { color-scheme: dark; }
          body {
            margin: 0;
            font-family: Inter, Segoe UI, Arial, sans-serif;
            background: radial-gradient(circle at top left, #18314f, #050816 55%, #02030a 100%);
            color: #f5f7ff;
            display: grid;
            place-items: center;
            min-height: 100vh;
          }
          .card {
            width: min(860px, 92vw);
            padding: 32px;
            border-radius: 24px;
            background: rgba(7, 12, 24, 0.78);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 20px 70px rgba(0,0,0,0.35);
            backdrop-filter: blur(16px);
          }
          h1 { font-size: 2.1rem; margin: 0 0 10px; }
          p { line-height: 1.7; color: #a9bad3; }
          .pill {
            display: inline-block;
            margin: 8px 8px 0 0;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(34, 211, 238, 0.16);
            color: #79f5ff;
            border: 1px solid rgba(34, 211, 238, 0.2);
            font-size: 0.95rem;
          }
          a {
            color: #7dd3fc;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>ART-AI Platform</h1>
          <p>
            A premium autonomous red teaming and AI art experience built with FastAPI, React, and a modular backend architecture.
          </p>
          <div>
            <span class="pill">FastAPI Backend</span>
            <span class="pill">AI Image Generation</span>
            <span class="pill">Frontend Dashboard</span>
          </div>
          <p>
            Open <a href="/docs">/docs</a> for the interactive API docs or visit the frontend at <a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a>.
          </p>
        </div>
      </body>
    </html>
    """