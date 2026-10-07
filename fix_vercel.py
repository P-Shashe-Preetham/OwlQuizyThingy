import json

with open("vercel.json", "r") as f:
    config = json.load(f)

# Configure secure headers
config["headers"] = [
    {
        "source": "/(.*)",
        "headers": [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
            { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
    }
]

with open("vercel.json", "w") as f:
    json.dump(config, f, indent=2)

print("vercel.json updated with security headers.")
