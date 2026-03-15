import requests
import time
import uuid
import threading

task_id = str(uuid.uuid4())

def poll_progress():
    for _ in range(30):
        try:
            r = requests.get(f'http://localhost:8000/api/progress/{task_id}')
            print('Progress:', r.json())
        except Exception:
            pass
        time.sleep(1)

t = threading.Thread(target=poll_progress)
t.start()

print("Starting Upload...")
start_time = time.time()
try:
    with open('/home/kamyavardhan/Desktop/Dyslex/lexara-ai/backend/out.pdf', 'rb') as f:
        res = requests.post('http://localhost:8000/api/upload_and_process', files={'file': f}, data={'task_id': task_id})
        print(f"Status: {res.status_code}")
except Exception as e:
    print(f"Error: {e}")
print(f"Time Taken: {time.time() - start_time:.2f} seconds")
t.join()
