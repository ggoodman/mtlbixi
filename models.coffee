module.exports.initModels = (mongoose) ->
  
  StationStatusSchema = new mongoose.Schema
    time: Date
    bikes: Number
    free: Number
  
  StationSchema = new mongoose.Schema
    id: String
    name: String
    loc:
      lat: Number
      lng: Number
    history: [StationStatusSchema]
  
  StationSchema.index(loc: '2d')
  
  mongoose.model 'Station', StationSchema