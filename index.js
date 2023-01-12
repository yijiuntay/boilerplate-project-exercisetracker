const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParserMiddleware = express.urlencoded({ extended: true });
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// solution
let userSchema = new mongoose.Schema({
  username: String
});
let User = mongoose.model("User", userSchema);
let exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});
let Exercise = mongoose.model("Exercise", exerciseSchema);

const createAndSaveUser = (username, done) => {
  let newUser = new User({
    username: username
  });
  newUser.save((err, data) => {
    if (err) return console.error(err);
    done(data);
  });
};

const returnUsers = (done) => {
  User.find({}, (err, data) => {
    if (err) console.error(err);
    let userArr = data.map((o) => {
      return { _id: o._id, username: o.username }
    });
    done(userArr);
  });
};

const createAndSaveExercise = (id, description, duration, date, done) => {
  let exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();
  let exerciseDuration = parseInt(duration);

  let userData = {
    description: description,
    duration: exerciseDuration,
    date: exerciseDate,
  };

  User.findById({ _id: id }, (err, data) => {
    if (err) return console.error(err);
    userData["username"] = data.username;
    userData["_id"] = data._id;

    let newExercise = new Exercise({
      username: userData.username,
      description: description,
      duration: exerciseDuration,
      date: exerciseDate
    });
    newExercise.save((err, data) => {
      if (err) return console.error(err);
      done(userData);
    });
  });
};

const returnLogs = (id, from, to, limit, done) => {
  let logData = {};

  User.findById({ _id: id }, (err, data) => {
    if (err) return console.error(err);
    logData["username"] = data.username;
    logData["_id"] = data._id;

    let exerciseQuery = Exercise.find({ username: logData.username });
    if (from) {
      exerciseQuery.find({ date: { $gte: from } });
    }
    if (to) {
      exerciseQuery.find({ date: { $gte: from } });
    }
    if (limit) {
      exerciseQuery.limit(limit);
    }
    exerciseQuery.exec((err, data) => {
      if (err) return console.error(err);
      logData["count"] = data.length;
      logData["log"] = data.map((o) => {
        return {
          description: o.description,
          duration: o.duration,
          date: o.date.toDateString(),
        }
      });
      console.log("logData", logData);
      done(logData);
    });
  });
};

app.use(bodyParserMiddleware);
app.post("/api/users", (req, res) => {
  createAndSaveUser(req.body.username, (data) => {
    res.json({
      username: req.body.username,
      _id: data.id
    });
  });
});

app.get("/api/users", (req, res) => {
  returnUsers((data) => {
    res.send(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  createAndSaveExercise(
    req.params._id,
    req.body.description,
    req.body.duration,
    req.body.date,
    (data) => {
      res.json(data);
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  returnLogs(
    req.params._id,
    req.query.from,
    req.query.to,
    req.query.limit,
    (data) => {
      res.send(data);
    });
});