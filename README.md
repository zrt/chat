# chat

* end2end crypto chat
* private key never leave memory

## Firebase Realtime Database

```javascript
{
    "users": {
        "user1": {
            "name": "user1",
            "email": "a@b.cc",
            "pubkey": "thepubkey",
            "keyhash": "hhh",
            "last_seen": 233
        }
    },
    "messages": {
        "user2": {
            "msgid": {
                "from": "user1",
                "to": "user2",
                "time": 233,
                "encrypted": ""
            }
        }
    }
}

```
