// Generated by CoffeeScript 1.6.1
(function() {
  var app, esri, express, fs, request, toTopoJson, topojson;

  express = require("express");

  request = require("request");

  esri = require("./jsonConverters");

  topojson = require("topojson");

  fs = require("fs");

  app = express();

  app.use(express.compress());

  app.get("/geoserver/:state/:featuretype", function(req, res) {
    var convertToTopojson, defaults, maxfeatures, url;
    defaults = {
      host: "localhost:8080",
      path: "" + req.params.state + "/wfs",
      version: "1.0.0"
    };
    if (req.query.maxfeatures != null) {
      maxfeatures = req.query.maxfeatures;
    }
    if ((req.query.format != null) && req.query.format === "topojson") {
      convertToTopojson = true;
    } else {
      convertToTopojson = false;
    }
    url = "http://" + defaults.host + "/" + defaults.path + "?";
    url += "service=WFS&version=" + defaults.version;
    url += "&request=GetFeature&outputformat=json";
    url += "&typename=" + req.params.featuretype;
    if (maxfeatures != null) {
      url += "&maxfeatures=" + maxfeatures;
    }
    console.log("Attempting connection to:\n\t" + url);
    return request.get(url, function(error, response, body) {
      var outputjson;
      outputjson = JSON.parse(body);
      if (convertToTopojson) {
        outputjson = toTopoJson(outputjson);
      }
      return res.json(outputjson);
    });
  });

  app.get("/esri/:folder/:service/:layer", function(req, res) {
    var convertToTopojson, defaults, url;
    if (req.query.bbox == null) {
      res.status(400..send("Please specify a bbox query parameter."));
      return;
    }
    if ((req.query.format != null) && (req.query.format = "topojson")) {
      convertToTopojson = true;
    } else {
      convertToTopojson = false;
    }
    defaults = {
      host: "services.azgs.az.gov",
      path: "ArcGIS/rest/services",
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects"
    };
    url = "http://" + defaults.host + "/" + defaults.path + "/" + req.params.folder + "/" + req.params.service + "/MapServer/" + req.params.layer + "/query?";
    url += "geometry=" + req.query.bbox;
    url += "&geometryType=" + defaults.geometryType;
    url += "&inSR=" + defaults.inSR;
    url += "&spatialRel=" + defaults.spatialRel;
    url += "&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&f=json";
    console.log("Attempting connection to:\n\t" + url);
    return request.get(url, function(error, response, body) {
      var esrijson, outputjson;
      esrijson = JSON.parse(body);
      outputjson = esri.esriConverter().toGeoJson(esrijson);
      if (convertToTopojson) {
        outputjson = toTopoJson(outputjson);
      }
      return res.json(outputjson);
    });
  });

  toTopoJson = function(geojson) {
    var options;
    options = {
      verbose: true,
      "coordinate-system": "auto",
      quantization: 1e4,
      "stich-poles": true,
      "property-transform": function(o,k,v) {o[k]=v; return true;}
    };
    return topojson.topology(geojson.features, options);
  };

  app.listen(3000);

}).call(this);
