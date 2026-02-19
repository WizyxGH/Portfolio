import requests
import os

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

urls = {
    "uyenuyen.jpg": "https://media.licdn.com/dms/image/v2/D4E03AQGcW8XmaCdqYQ/profile-displayphoto-crop_800_800/B4EZk75hnbIUAI-/0/1757646560718?e=1771459200&v=beta&t=WY_lIweBHLhZPDeA5rkV3MlQQzEyTordi8iRIflBVgE",
    "thuytrang.jpg": "https://media.licdn.com/dms/image/v2/D5603AQF4zgVsR7zIjg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1686543517585?e=1771459200&v=beta&t=7X3XvboAwreF-Mko9Bejs2LuSCF09kTq50vcdImbykg"
}

output_dir = "assets/media"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for filename, url in urls.items():
    filepath = os.path.join(output_dir, filename)
    try:
        print(f"Downloading {filename}...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded {filename} ({len(response.content)} bytes)")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
