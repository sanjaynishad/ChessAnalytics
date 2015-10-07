var crypto = require('crypto');
var sendgrid  = require('sendgrid')(
		  process.env.SENDGRID_USERNAME,
		  process.env.SENDGRID_PASSWORD
		);
var gmailaccount = 'chessmaster288@gmail.com';
var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'+
'<html xmlns="http://www.w3.org/1999/xhtml">'+
'<head>'+
'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'+
'<title>First Move Newsletter</title>'+
'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>'+
'</head>'+
'<body>'+
'<table align="center" cellpadding="0" cellspacing="0" width="800">'+
'<tr>'+
'<td>'+
'<table align="center" cellpadding="0" cellspacing="0">'+
'<tr>'+
'<td>'+
'<img title="" caption="" src="http://jason.s16931283.onlinehome-server.com/email/image//Top.jpg" alt="" width="800" height="231" border="0" hspace="0" vspace="0" />'+
'</td>'+
'</tr>'+
'</table>'+
'<table align="center" valign="top" cellpadding="0" cellspacing="0">'+
'<tr>'+
'<td style="background-image: url(\'http://jason.s16931283.onlinehome-server.com/email/image//Mid.jpg\'); width:800px; height:493px; ">'+
	'<p style="font-family: Helvetica; font-size: 20px; margin:0px 50px 0px 50px;">Dear <strong>@Teacher,</strong></p><br/>'+
	'<p style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px;">Thank-you for registering for the First Move Program\'s online access. We are excited to introduce you to our new Online Play chess system and hope you are eager to try it out.</p><br/><br/>'+
	'<a href="#" style="text-decoration:none; color:#0f4b9b;  width:200px;" ><p align="center" style="font-family: Helvetica; font-size: 18px; margin:0px 50px 0px 50px;"><strong><a href="http://www.af4c.org" target="_new">Here\'s the link</a></strong></p><br/></a>'+
	'<a href="#" style="text-decoration:none; color:#0f4b9b;  width:200px;" ><p align="center" style="font-family: Helvetica; font-size: 18px; margin:0px 50px 0px 50px;"><strong><a href="http://www.chessforlife.net/1stmove.pdf" target="_new">And the instructions</a></strong></p><br/></a>'+
	'<p style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px;">Your username is: @username</p><br/>'+
	'<p style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px;">Your password is: @password</p><br/><br/>'+
	'<p style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px;">You will receive email instructions to register your students in a few weeks. They will not need Online Play until they have finished their Pawn Lessons.'+
	'</p><br/><br/>'+
	'<p align="right" style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px; color:#212e40;font-weight:50;"> Thank you and have a great year!'+
	'</p><br/>'+
	'<p align="right" style="font-family: Helvetica; font-size: 18px;margin:0px 50px 0px 50px;">Warm Regards, <br/>'+
	'<font style="font-style:italic">  The First Move Staff</font>'+
	'</p><br/>'+
	'</td>'+
	'</tr>'+
	'</table>'+
	'<table align="center" cellpadding="0" cellspacing="0" width="800">'+
	'<tr>'+
	'<td style="background-color:#f5f6f8;" align="center">'+
	'<img title="" caption="" src="http://jason.s16931283.onlinehome-server.com/email/image//Bottom.jpg" alt="" width="405" height="72" border="0" hspace="0" vspace="0" />'+
	'</td>'+
	'</tr>'+
	'</table>'+
	'</body>'+
	'</html>';

var text = 'Dear @Teacher, \n'+
'Thank-you for registering for the First Move Program\'s online access. We are excited to introduce you to our new Online Play chess system and hope you are eager to try it out. \n'+
'Here\'s the link: http://www.af4c.org \n'+
'And the instructions: http://www.chessforlife.net/1stmove.pdf \n'+
'Your username is: @username \n'+
'Your password is: @password \n'+
'You will receive email instructions to register your students in a few weeks. They will not need Online Play until they have finished their Pawn Lessons. \n'+
'Thank you and have a great year! \n'+
'The First Move Staff \n';

module.exports = {

    encrypt: function (plainText) {
        return crypto.createHash('md5').update(plainText, 'utf8').digest('hex');
    },

    sendRegEmail: function (data,callback) {
    	var emailData = {
		        to:       data.email,
		        from:     'Welcome to 1stmove\'s online play <'+gmailaccount+'>',
		        subject:  'Dear '+data.teacher, // Subject line
			    text: text.replace("@Teacher",data.teacher).replace("@username",data.email).replace("@password",data.pwd), // plaintext body
			    html: html.replace("@Teacher",data.teacher).replace("@username",data.email).replace("@password",data.pwd) // html body
		      };
	    sendgrid.send(emailData, callback);
    },

    sendEmail: function (data,callback) {
	    sendgrid.send(data, callback);
    },

    randomString: function (length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';

        var string = '';

        for (var i = 0; i < length; i++) {
            var randomNumber = Math.floor(Math.random() * chars.length);
            string += chars.substring(randomNumber, randomNumber + 1);
        }

        return string;
    }
};
