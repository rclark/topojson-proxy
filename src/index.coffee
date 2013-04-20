express = require "express"
request = require "request"
esri = require "./jsonConverters"
topojson = require "topojson"
fs = require "fs"
app = express();

app.use express.compress()

app.get "/geoserver/:state/:featuretype", (req, res) ->
  # default parameters
  defaults =
    host: "localhost:8080"
    path: "#{req.params.state}/wfs"
    version: "1.0.0"
    
  maxfeatures = req.query.maxfeatures if req.query.maxfeatures?    
    
  if req.query.format? and req.query.format is "topojson"
    convertToTopojson = true
  else
    convertToTopojson = false
    
  url = "http://#{defaults.host}/#{defaults.path}?"
  url += "service=WFS&version=#{defaults.version}"
  url += "&request=GetFeature&outputformat=json"
  url += "&typename=#{req.params.featuretype}"
  url += "&maxfeatures=#{maxfeatures}" if maxfeatures?
  
  console.log "Attempting connection to:\n\t#{url}"
  
  request.get url, (error, response, body) ->
    outputjson = JSON.parse body
    outputjson = toTopoJson(outputjson) if convertToTopojson     
    res.json outputjson
  
app.get "/esri/:folder/:service/:layer", (req, res) ->
  if not req.query.bbox?
    res.status 400
      .send "Please specify a bbox query parameter."
    return
    
  if req.query.format? and req.query.format = "topojson"
    convertToTopojson = true
  else
    convertToTopojson = false
    
  defaults =
    host: "services.azgs.az.gov"
    path: "ArcGIS/rest/services"
    geometryType: "esriGeometryEnvelope"
    inSR: "4326"
    spatialRel: "esriSpatialRelIntersects"
    
  url = "http://#{defaults.host}/#{defaults.path}/#{req.params.folder}/#{req.params.service}/MapServer/#{req.params.layer}/query?"
  url += "geometry=#{req.query.bbox}"
  url += "&geometryType=#{defaults.geometryType}"
  url += "&inSR=#{defaults.inSR}"
  url += "&spatialRel=#{defaults.spatialRel}"
  url += "&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&f=json"
  
  console.log "Attempting connection to:\n\t#{url}"
  
  request.get url, (error, response, body) ->
    esrijson = JSON.parse body
    outputjson = esri.esriConverter().toGeoJson esrijson             
    outputjson = toTopoJson(outputjson) if convertToTopojson     
    res.json outputjson
    
toTopoJson = (geojson) ->
  options = 
    verbose: true
    "coordinate-system": "auto"
    quantization: 1e4
    "stich-poles": true
    "property-transform": (o,k,v) ->
      o[k] = v
      return true
  objects =
    features: geojson
  topojson.topology objects, options
    
app.listen 3000
