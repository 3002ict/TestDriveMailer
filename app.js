var express = require("express");
var app = express();
var async = require('async');
var helper = require('sendgrid').mail;
var firebase = require('firebase');

//loading env file for development environment
// var dotenv = require('dotenv');
// dotenv.load();

var sendgrid_api_key = process.env.SENDGRID_API_KEY;
var sg = require('sendgrid')(sendgrid_api_key);


//firebase server configuration
var databaseURL = process.env.DATABASE_URL;
var project_id = process.env.FIREBASE_PROJECT_ID;
var client_email = process.env.FIREBASE_CLIENT_EMAIL;
var private_key = process.env.FIREBASE_PRIVATE_KEY;

firebase.initializeApp({
  serviceAccount: {
    projectId: project_id,
    clientEmail: client_email,
    privateKey: private_key
    },
  databaseURL: databaseURL
});

app.get('/', function(req, res){
    if(req.query.key != null){
     firebase.database().ref('/drives/' + req.query.key).once('value').then(function(snapshot) {
        if(snapshot.val() != null){
            var drive = snapshot.val();
            if(drive.status == "pending"){
                var from_email = new helper.Email('do_not_reply@testdriveregister.com');
                var to_email = new helper.Email(drive.email);
                var subject = 'Test Drive Register';
                var content_body = "Hi, " + drive.drivername + " \n"
                                    + "Thanks for taking the drive and accepting the T&Cs, any questions contact 123456789";
                var content = new helper.Content('text/plain', content_body);
                var mail = new helper.Mail(from_email, subject, to_email, content);
                var request = sg.emptyRequest({
                  method: 'POST',
                  path: '/v3/mail/send',
                  body: mail.toJSON(),
                });
                
                sg.API(request, function(error, response) {
                    if(error){
                        console.log(error);
                    }else{
                        console.log(response.statusCode);
                        console.log(response.body);
                        console.log(response.headers);   
                    }
                });
                
                var updates = {};
                updates['/drives/' + req.query.key + '/status'] = "completed";
                firebase.database().ref().update(updates);
            }else{
                console.log("Invalid drive data");   
            }
        }else{
            console.log("No data found");
        }
      });
    }
    
    return res.end();
});



app.listen(process.env.PORT, process.env.IP, function(){
  console.log('mailer is running');
})