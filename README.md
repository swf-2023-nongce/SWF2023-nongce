# 농스(Nongce): zkVoiceDetector (가제) 모노레포

## Instsall & Start

```bash
# 1. interface - 3000 port
cd interface && npm install && npm run start # we should use react-scripts to run server due to proxy setting

# 2. api server - 8080 port
cd services/api-server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080

# 3. (optional) hardhat testnet - 9945 port
cd contracts && npm install && npm run dev
```
