import express from "express";
import path from "path";
import morgan from "morgan";
import routes from "./routes/index.js";
import bodyParser from "body-parser";
import request from "request";
import OpenAI from "openai";


import config from "./config.js";
import {fileURLToPath} from "url";

const app = express();
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Settings
app.set("port", config.PORT);
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

// global variables
app.use(bodyParser.json()); 
app.use((req, res, next) => {
  console.log(config.APPID)
  app.locals.APPID = config.APPID;
  next();
});

app.post('/webhook', (req, res) => {
  console.log('POST: webhook');
    const body = req.body;
    if (body.object === 'page') {
        body.entry.forEach(entry=> {
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);
            // Handle the message event
            const sender_psid = webhookEvent.sender.id;
            console.log(`sender PSID: ${sender_psid}`);

            //validar que se recibe mensajes
            if (webhookEvent.message) {
              HandleMessage(sender_psid,webhookEvent.message);
            }else if (webhookEvent.postback) {
              HandlePostback(sender_psid,webhookEvent.postback);
              
            }
        });
        res.status(200).send('Evento recibido');
    } else {
        res.sendStatus(404);
    }
});
app.get('/webhook', (req, res) => {
  console.log('GET: webhook');
  const VERIFY_TOKEN = 'sergioEmiliano';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          console.log('webhook verificado');
          res.status(200).send(challenge);
      } else {
          res.sendStatus(404);
      }
  }
});

//Funciones para manipular chats





function HandleMessage(sender_psid,received_message) {
  let response;
  if (received_message.text) {
  response = {
    'text' : `tu mensaje fue YA FREGAMOS ${received_message.text}`
    } ;

  }
  callSendAPI(sender_psid,response);
}
function HandlePostback(sender_psid,received_postback) {
  
}

function callSendAPI(sender_psid,response) {
  const requestBody = {
    'recipient' : {
      'id' : sender_psid
    },
    'message': response
  };
    request({
      'uri':'https://graph.facebook.com/v2.6/me/messages',
      'qs': {'access_token': PAGE_ACCESS_TOKEN},
      'method': 'POST',
      'json': requestBody
      
    },(err,res,body)=>{
      if(!err){
        console.log("mensaje enviado");
      }else{
        console.error("Error al enviar el mensaje", err);
      }
    });
}



//fin--------------------------

// Routes
app.use(routes);

app.use(express.static(path.join(__dirname, "public")));

// 404 handler
app.use((req, res, next) => {
  res.status(404).render("404");
});

export default app;
