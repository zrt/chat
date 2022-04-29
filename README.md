# chat

* end2end encrypted chat
* private key never leave memory

## Firebase Realtime Database

```javascript
{
    "users": {
        "user1": {
            "name": "user1",
            "pubkey": "thepubkey",
            "last_seen": 233
        }
    },
    "messages": {
        "user2": {
            "msgid": "encrypted"
        }
    }
}

```

```javascript
{
  "rules": {
    	"secrets":{
        ".read": false,
        ".write": false,
      },
    	"users":{
        ".read" : "auth != null",
        "$uid": {
          ".write": "$uid === auth.uid",
          "add": {
            ".validate": "newData.isNumber()"
          },
          "name": {
            ".validate": "newData.isString()"
          },
          "pubkey": {
            ".validate": "newData.isString()"
          },
          "$other": { ".validate": false }
        }
      },
      "messages":{
        ".write": "auth != null",
        "$uid": {
          ".write": "auth != null",
          ".read": "$uid === auth.uid",
          "$key":{
            ".validate": "newData.isString()"
          }
        }
      },
      "world": {
        ".write": "auth != null",
        ".read": "auth != null",
      },
      "$other": { ".validate": false }
  }
}
```
