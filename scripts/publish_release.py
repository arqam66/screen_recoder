import os
import sys
import json
import subprocess
import urllib.request
import urllib.error

def get_token():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        return token
    try:
        proc = subprocess.run(["git", "credential", "fill"], input="protocol=https\nhost=github.com\n\n", capture_output=True, text=True, check=True)
        for line in proc.stdout.splitlines():
            if line.startswith("password="):
                return line.split("=", 1)[1]
    except Exception:
        pass
    return ""

TOKEN = get_token()
REPO = "arqam66/screen_recoder"
TAG = "v1.3.0"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "ScreenRecorderReleaseScript"
}

RELEASE_BODY = """## Screen Recorder v1.3.0 for Windows

A powerful, privacy-first desktop screen recorder for Windows 10 & 11 built with Electron.

### Downloads

| Package | Filename | Size | Description |
|---|---|---|---|
| **Installer** | [`Screen.Recorder-Setup-1.3.0.exe`](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen.Recorder-Setup-1.3.0.exe) | ~75 MB | Full installer with Start Menu & Desktop shortcuts |
| **Portable** | [`Screen.Recorder-1.3.0.exe`](https://github.com/arqam66/screen_recoder/releases/download/v1.3.0/Screen.Recorder-1.3.0.exe) | ~75 MB | Standalone executable, no install required |

### What's New in v1.3.0
- **Theme Toggle Switch**: Smooth animated switch toggling Dark, Light, and Light Panda themes.
- **Strict Content Security Policy (CSP)**: Enhanced application security and injection protection.
- **Audio & Video Pipeline**: WASAPI loopback audio, microphone mixing, and multi-hour stream recording.
- **Elephant-and-Goldfish Model (EGM)** & **Loop Engineering**: Formalized architectural contracts and verification workflows.

### SHA-256 Checksums
- `Screen Recorder-Setup-1.3.0.exe`: `F7F34129EB79283D0EAB00D5671232CEE766766173507897C63A7273EB395C64`
- `Screen Recorder-1.3.0.exe`: `7D011197AF652104D3387F9A5AA05D5E05CD335AE3B275B55A52B564FB928EC2`
"""

def create_or_get_release():
    url = f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Existing release found: ID {data['id']}")
            # Update body with latest hashes
            update_url = f"https://api.github.com/repos/{REPO}/releases/{data['id']}"
            update_req = urllib.request.Request(update_url, data=json.dumps({"body": RELEASE_BODY}).encode('utf-8'), headers=HEADERS, method="PATCH")
            with urllib.request.urlopen(update_req) as u_resp:
                data = json.loads(u_resp.read().decode('utf-8'))
                print("Release notes updated with latest SHA-256 checksums.")
            return data
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise

    print("Creating new release...")
    create_url = f"https://api.github.com/repos/{REPO}/releases"
    body = {
        "tag_name": TAG,
        "target_commitish": "main",
        "name": "Screen Recorder v1.3.0 for Windows",
        "body": RELEASE_BODY,
        "draft": False,
        "prerelease": False
    }
    req = urllib.request.Request(create_url, data=json.dumps(body).encode('utf-8'), headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Release created successfully: ID {data['id']}, HTML URL: {data['html_url']}")
        return data

def upload_asset(release, filepath, content_type="application/octet-stream"):
    filename = os.path.basename(filepath)
    upload_url_template = release["upload_url"].split("{")[0]
    upload_url = f"{upload_url_template}?name={urllib.parse.quote(filename)}"

    # Check if asset already exists (normalizing spaces and dots)
    def norm(n):
        return n.replace(" ", ".").lower()

    assets_url = f"https://api.github.com/repos/{REPO}/releases/{release['id']}/assets"
    assets_req = urllib.request.Request(assets_url, headers=HEADERS)
    with urllib.request.urlopen(assets_req) as resp:
        current_assets = json.loads(resp.read().decode('utf-8'))

    for asset in current_assets:
        if norm(asset["name"]) == norm(filename):
            print(f"Asset '{asset['name']}' already exists (ID: {asset['id']}), deleting prior upload...")
            del_url = f"https://api.github.com/repos/{REPO}/releases/assets/{asset['id']}"
            del_req = urllib.request.Request(del_url, headers=HEADERS, method="DELETE")
            urllib.request.urlopen(del_req)
            print(f"Deleted old asset {asset['id']}")

    file_size = os.path.getsize(filepath)
    print(f"Uploading {filename} ({file_size / (1024*1024):.2f} MB)...")

    with open(filepath, "rb") as f:
        file_data = f.read()

    headers = dict(HEADERS)
    headers["Content-Type"] = content_type
    headers["Content-Length"] = str(len(file_data))

    req = urllib.request.Request(upload_url, data=file_data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Uploaded {filename}: ID {res['id']}, Download URL: {res['browser_download_url']}")
        return res

if __name__ == "__main__":
    release = create_or_get_release()
    upload_asset(release, "release/Screen Recorder-Setup-1.3.0.exe", "application/vnd.microsoft.portable-executable")
    upload_asset(release, "release/Screen Recorder-1.3.0.exe", "application/vnd.microsoft.portable-executable")
    upload_asset(release, "release/latest.yml", "text/yaml")
    print("All release assets uploaded successfully!")
