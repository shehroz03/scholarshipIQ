#!/bin/bash
set -e

echo "Starting Backend Setup..."

# Update and install required packages
sudo apt update
sudo apt install -y python3-pip python3-venv git nginx

# Clone repository if it doesn't exist, else pull latest
if [ ! -d "scholarshipIQ" ]; then
    git clone https://github.com/shehroz03/scholarshipIQ.git
else
    cd scholarshipIQ
    git pull
    cd ..
fi

cd scholarshipIQ/backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service for FastAPI
cat << 'EOF' | sudo tee /etc/systemd/system/scholarlq.service
[Unit]
Description=Gunicorn instance to serve ScholarIQ Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/scholarshipIQ/backend
Environment="PATH=/home/ubuntu/scholarshipIQ/backend/.venv/bin"
ExecStart=/home/ubuntu/scholarshipIQ/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
EOF

# Start and enable the service
sudo systemctl daemon-reload
sudo systemctl start scholarlq
sudo systemctl enable scholarlq

echo "Backend Setup Complete!"
