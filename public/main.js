import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js'
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js'

// register to db
var firebaseConfig = {
    apiKey: "AIzaSyBwq4rp9s_zrZf89kZ7cAg0ctAlJ754uwQ",
    authDomain: "chat-by-bond.firebaseapp.com",
    databaseURL: "https://chat-by-bond-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "chat-by-bond",
    storageBucket: "chat-by-bond.appspot.com",
    appId: "chat-by-bond",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

await signInAnonymously(auth)
  .then((result) => {
    //   console.log(result);
      user_id = result.user.uid;
      console.info('sign in anonymously');
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(error);
  });
console.log(user_id);

// realtime db
import { getDatabase, ref, set, push, child, onValue, onChildAdded, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database.js"


// pubkey, privkey
const alg = {
    name: "RSA-OAEP",
    modulusLength: 4096+256,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: {name: "SHA-256"}
}
const iv = [78, 199, 116, 31, 160, 156, 200, 193, 224, 69, 111, 143, 68, 20, 192, 55];
const key_pair = await generateKey(alg, ["encrypt", "decrypt"]);

const public_key = key_pair.publicKey
const private_key = key_pair.privateKey
const public_key_export = await exportPublicKey(public_key);

var users_data = {};
const db = getDatabase();

async function key_prefix(key){
    // sha1
    var hash = await window.crypto.subtle.digest({name: "SHA-1"}, textToArrayBuffer(key));
    var hash = arrayBufferToBase64String(hash);
    return hash.substring(0, 10);
}

function add_to_board(msg){
    var board = document.getElementById('msg');
    var li = document.createElement("blockquote");
    li.innerText = msg;
    var footer = document.createElement("footer");
    footer.innerText = new Date();
    li.appendChild(footer);
    board.appendChild(li);
}

// 0. monitor the world id
var world_id = null;
const world = ref(db, "world");
onValue(world, function(snapshot){
    if(world_id){
        window.location = window.location;
    }
    world_id = snapshot.val();
    document.getElementById('world-id').innerText = world_id;
    console.log("world_id: " + world_id);
});



// 1. set my user data
if(user_id){
    set(ref(db, 'users/' + user_id), {
        name: user_id,
        pubkey : public_key_export,
        add: + new Date()
    });
    // set my-info
    document.getElementById('my-info').innerText = user_id + ' <' + await key_prefix(public_key_export) +'>';
    // build empty queue
    set(ref(db, 'messages/' + user_id), {});
    // on disconnect
    onDisconnect(ref(db, 'users/'+user_id)).remove();
    onDisconnect(ref(db, 'messages/'+user_id)).remove();
}

// 2. monitor users
var in_list = false;
async function update_users_list(){
    var user_cnt = Object.keys(users_data).length;
    document.getElementById('online-num').innerText = user_cnt;

    var users_list = document.getElementById("users_list");
    users_list.innerText = "";
    var flag = false;
    for(var uid in users_data){
        var user = users_data[uid];
        var li = document.createElement("li");
        li.innerText = user.name + ' <' + await key_prefix(user.pubkey) +'>';
        users_list.appendChild(li);
        console.log(user_id);
        console.log(uid);
        console.log(user_id === uid);
        if(user_id === uid){
            flag = true;
        }
    }
    if(!in_list){
        if(flag){
            in_list = true;
        }
    }else{
        if(!flag){
            add_to_board('warning, you are not online');
        }
    }
}

const users = ref(db, "users");
onValue(users, (snapshot) => {
    const data = snapshot.val();
    users_data = data;
    update_users_list();
    // console.log(data);
});



// 3. monitor my messages

const my_msgs = ref(db, "messages/" + user_id);
onChildAdded(my_msgs, async (snapshot) => {
    const data = snapshot.val();
    // console.log(data);
    var msg_enc = base64StringToArrayBuffer(data);
    try{
    var msg_dec = await decryptData(iv, private_key, msg_enc);
    var msg = arrayBufferToText(msg_dec);
    msg = decodeURI(msg);
    // console.log(msg);
    add_to_board(msg);
    }catch(e){
        console.error(e);
        add_to_board(e);
        add_to_board('Your key is expired, please refresh the page.');
    }
});


// 4. send messages

function send_message(to_user, content){
    const new_msg_key = push(child(ref(db), 'messages/' + to_user)).key;
    set(ref(db, 'messages/' + to_user + '/' + new_msg_key), content);
    console.log('send message to ' + to_user);
}
async function broadcast_message(content){
    // todo, sign the message
    content = encodeURI(content);
    // console.log(users_data);
    for(var user_id in users_data){
        var msg_enc = await encryptData(iv, await importPublicKey(users_data[user_id].pubkey, alg), content);
        msg_enc = arrayBufferToBase64String(msg_enc);
        send_message(users_data[user_id].name, msg_enc);
    }
    console.log('broadcast finished');
}

document.getElementById('broadcast').addEventListener('click', async () => {
    var content = document.getElementById('speak').value;
    if(content){
        await broadcast_message(content);
        document.getElementById('speak').value = "";
    }
});

// 5. destroy the world

document.getElementById('refresh').addEventListener('click', () => {
    window.location = window.location;
});
document.getElementById('destroy').addEventListener('click', () => {
    set(ref(db, 'world'), parseInt(Math.random() *100000000));
    set(ref(db, 'users'), {});
    set(ref(db, 'messages'), {});
});

// generate and update my data
add_to_board("Welcome!");
