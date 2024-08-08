require('dotenv').config();
const http = require("http");
const fs = require("fs");
const requests = require("requests");
const Port = 8000;

const indexFile = fs.readFileSync("index.html", "utf-8");

const replaceVal = (tempVal, orgVal) => {
  if (!orgVal.main || !orgVal.sys || !orgVal.weather || orgVal.weather.length === 0) {
    console.error("Invalid data structure:", orgVal);
    return tempVal; // Return the original template if data is invalid
  }

  let temperature = tempVal.replace("{%tempval%}", orgVal.main.temp);
  temperature = temperature.replace("{%tempmin%}", orgVal.main.temp_min);
  temperature = temperature.replace("{%tempmax%}", orgVal.main.temp_max);
  temperature = temperature.replace("{%location%}", orgVal.name);
  temperature = temperature.replace("{%country%}", orgVal.sys.country);
  temperature = temperature.replace("{%tempstatus%}", orgVal.weather[0].main);
  return temperature;
};

const server = http.createServer((req, res) => {
  if (req.url == "/") {
    requests(
`https://api.openweathermap.org/data/2.5/weather?q=Gwalior&appid=${process.env.API_KEY}`)
      .on("data", (chunk) => {
        try {
          const objdata = JSON.parse(chunk);
          console.log("API Response:", objdata); // Log the response for debugging

          const arrData = [objdata];
          const realTimeData = arrData
          .map((val) => replaceVal(indexFile, val)).join("");

          // Set the content type and write the response
          res.writeHead(200, { "Content-Type": "text/html" });
          res.write(realTimeData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error parsing data");
        }
      })
      .on("end", (err) => {
        if (err) {
          console.log("Connection closed due to errors", err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error fetching data");
        } else {
          res.end();
        }
      });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("File not found");
  }
});

server.listen(Port,()=>{
  console.log(`Server is running on http://localhost:${Port}`);
});
