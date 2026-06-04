#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="$(dirname "$0")/../data/osrm"
PBF_URL="https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf"
PBF_FILE="$DATA_DIR/kanto-latest.osm.pbf"
OSRM_FILE="$DATA_DIR/kanto.osrm"

mkdir -p "$DATA_DIR"

if [ ! -f "$PBF_FILE" ]; then
  echo "Downloading Kanto OSM data..."
  curl -L "$PBF_URL" -o "$PBF_FILE"
fi

echo "Processing OSRM data (this may take several minutes)..."
docker run --rm -t -v "$DATA_DIR:/data" ghcr.io/project-osrm/osrm-backend:latest \
  osrm-extract -p /opt/car.lua /data/kanto-latest.osm.pbf

docker run --rm -t -v "$DATA_DIR:/data" ghcr.io/project-osrm/osrm-backend:latest \
  osrm-partition /data/kanto.osrm

docker run --rm -t -v "$DATA_DIR:/data" ghcr.io/project-osrm/osrm-backend:latest \
  osrm-customize /data/kanto.osrm

echo "OSRM data ready at $OSRM_FILE"
echo "Start with: docker compose --profile osrm up -d osrm"
