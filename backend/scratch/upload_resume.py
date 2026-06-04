import httpx
import os

def upload():
    url = "http://localhost:8000/api/v1/master-resumes/upload"
    file_path = "scratch/john_doe_resume.txt"
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    files = {"file": (os.path.basename(file_path), open(file_path, "rb"), "text/plain")}
    data = {"name": "John Doe Master"}
    
    print(f"Uploading {file_path} to {url}...")
    try:
        response = httpx.post(url, data=data, files=files, timeout=10.0)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        print(response.json())
    except Exception as e:
        print(f"Upload failed: {e}")

if __name__ == "__main__":
    upload()
