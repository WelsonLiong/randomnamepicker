import time
import base64
import os
import subprocess
from PIL import Image
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

TEN_STUDENTS = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia',
    'Lucas', 'Ava', 'Mason', 'Isabella', 'Ethan'
]

def record_game(driver, game_id, output_name, duration_sec=6.5, trim_start_sec=1.2):
    print(f"--- Starting recording for {game_id} with 10 students ---")
    
    # Launch game and enforce 10 students roster
    driver.execute_script(f"""
        localStorage.setItem('lucky_duck_classroom_names', JSON.stringify({TEN_STUDENTS}));
        if (window.app.roster) {{
            window.app.roster.loadRoster();
        }}
        window.app.launchGame('{game_id}');
    """)
    time.sleep(1.0)
    
    # Start race physics and record canvas stream directly
    js_script = f"""
    const callback = arguments[arguments.length - 1];
    const canvas = document.getElementById('riverCanvas');
    const stream = canvas.captureStream(30);
    let recorder;
    try {{
        recorder = new MediaRecorder(stream, {{ mimeType: 'video/webm;codecs=vp9' }});
    }} catch (e) {{
        try {{
            recorder = new MediaRecorder(stream, {{ mimeType: 'video/webm' }});
        }} catch (e2) {{
            recorder = new MediaRecorder(stream);
        }}
    }}
    const chunks = [];
    recorder.ondataavailable = e => {{ if (e.data.size > 0) chunks.push(e.data); }};
    
    // Start active race / spin with 20s race duration
    if (window.app.activeGame && typeof window.app.activeGame.startRace === 'function') {{
        window.app.activeGame.startRace(20);
    }}
    
    recorder.start();
    setTimeout(() => {{
        recorder.stop();
    }}, {int(duration_sec * 1000)});
    
    recorder.onstop = () => {{
        const blob = new Blob(chunks, {{ type: 'video/webm' }});
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    }};
    """
    
    b64_data = driver.execute_async_script(js_script)
    raw_webm = f"temp_{output_name}.webm"
    with open(raw_webm, "wb") as f:
        f.write(base64.b64decode(b64_data))
    
    os.makedirs(os.path.join("assets", "previews"), exist_ok=True)
    out_mp4 = os.path.join("assets", "previews", f"{output_name}-preview.mp4")
    out_jpg = os.path.join("assets", "previews", f"{output_name}-poster.jpg")
    
    # Convert WebM to MP4 640x360 H.264 starting from trim_start_sec
    cmd_mp4 = [
        "ffmpeg", "-y", "-i", raw_webm,
        "-ss", str(trim_start_sec),
        "-vf", "scale=640:360:force_original_aspect_ratio=increase,crop=640:360",
        "-c:v", "libx264", "-crf", "22", "-preset", "fast",
        "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart",
        out_mp4
    ]
    subprocess.run(cmd_mp4, check=True)
    
    # Extract crisp poster from the exact first frame (00:00:00.0) of out_mp4
    cmd_jpg = [
        "ffmpeg", "-y", "-ss", "00:00:00.0", "-i", out_mp4,
        "-frames:v", "1",
        out_jpg
    ]
    subprocess.run(cmd_jpg, check=True)
    
    if os.path.exists(raw_webm):
        os.remove(raw_webm)
        
    print(f"Successfully generated {out_mp4} and {out_jpg}")

def main():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1600,900")
    options.add_argument("--autoplay-policy=no-user-gesture-required")
    options.add_argument("--use-fake-ui-for-media-stream")
    
    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost:8085/")
    time.sleep(1.5)
    
    games = [
        ("duck-race", "duck"),
        ("horse-race", "horse"),
        ("rocket-race", "rocket"),
        ("wheel-fortune", "wheel")
    ]
    
    for game_id, name in games:
        record_game(driver, game_id, name, duration_sec=6.5, trim_start_sec=1.2)
        
    driver.quit()
    print("All 4 game previews re-recorded with 10 students!")

if __name__ == "__main__":
    main()
