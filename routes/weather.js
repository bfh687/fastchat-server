const express= require('express')
const https = require('https')

// Initiate the route
var router= express.Router()

const bodyParser= require('body-parser')
router.use(bodyParser.urlencoded({extended: true}))
//require('dotenv').config()
//const apiKey = `${process.env.WEATHER_API}`;

router.get("/zipcode/:code",(req, res) => {
    let zip = req.params.code
    let unit = "imperial"
    console.log(zip)

    const url= "https://api.openweathermap.org/data/2.5/weather?zip="+zip+",us&units="+unit+"&appid="+process.env.WEATHER_API          
        if (zip) {
            https.get(url, (response)=>{
                response.on('data', (data)=>{
                    const weather=JSON.parse(data)
                    let info = weather.main.temp;
                    res.send({
                       zipcode: info
                    })
                })
    
            })
        } else {
            response.status(400).send({
                message: "Missing required information"
            })
        }
});
      /*  if(err){
          console.log('error:', error);
        } else {
            let weather = JSON.parse(body);
            let info = `Data for ${weather.main.temp}`;
           
          res.send({ 'body': info });
        }
        */
    
module.exports = router