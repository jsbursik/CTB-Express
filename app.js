const express = require('express');
const cors = require ('cors');
const fs = require('fs');

const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const bodyParser = require('body-parser');

require('dotenv').config({ path: './.env' });

const port = process.env.PORT || 3000;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

var corsOptions = {
    origin: `http://${process.env.CORS_HOST}`,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

const transporter = nodemailer.createTransport({
    host: 'mail.cartruckbuyer.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_SECRET
    },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/send', upload.array('photos'), function (req, res) {
    let form = req.body;
    let images = req.files;

    console.log(req.socket.remoteAddress);

    let fullName = form.firstName + " " + form.lastName;

    let subjectField = "New Lead - " + fullName;   
    
    let mailOptions = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_TO.split(","),
        subject: subjectField,
        text: "This message needs to be viewed in HTML",
        html: `
            <h3>Lead Contact Info:</h3>
            Name: ${fullName}<br>
            Email: ${form.email}<br>
            Phone: ${form.phone}<br>

            <hr>

            <h3>Lead Vehicle Info:</h3>
            Year: ${form.year}<br>
            Make: ${form.make}<br>
            Model: ${form.model}<br>
            Miles: ${form.miles}<br>
            Condition: ${form.condition}<br>    
            <hr>  
            <h3>Lead Optional Fields:</h3>
            VIN: ${form.vin}<br>
            Comments: ${form.comments}<br>
        `,
        attachments: []
    };

    for(var img of images){
        mailOptions.attachments.push({ filename: img.originalname, path: img.path });
    }

    transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end('error');
        } else {
            console.log('Message sent: ', response);
            res.end('sent');

            // This deletes anything that was uploaded.
            let files = fs.readdirSync('uploads');
            files.forEach(file => {
                let fullPath = "uploads/" + file;
                fs.unlink(fullPath, (err) => {
                    if (err) console.log(err);
                    else {
                        console.log(`Deleted ${file}`);
                    }
                });
            });
        }
    });
});

app.listen(port, () => {
    console.log('Express started on port: ', port);
});
