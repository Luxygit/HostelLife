const secrets = require("./secrets.json");
const { Pool } = require("pg");
const pool = new Pool(secrets);

const api = () => {
  const postNewEvent = async (request, response) => {
    const newEvent = request.body;
    console.log(newEvent);
    const result = await pool.query(
      `INSERT INTO events (title, description, startTime, location, imageFileName, category)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        newEvent.title,
        newEvent.description,
        newEvent.startTime,
        newEvent.location,
        newEvent.imageFileName,
        newEvent.category,
      ]
    );
    const responseBody = { eventId: result.rows[0].id };
    return response.status(201).json({
      status: "Event Successfully created.",
      NewEventId: responseBody.eventId,
    });
  };

  const getEvents = async (request, response) => {
    const category = request.query.category;
    try {
      if (!category) {
        const result = await pool.query(`select * FROM events`); // show all events
        response.status(200).send(result.rows);
      } else {
        const lowerCasedCategory = category.toLowerCase();
        const query = `SELECT * FROM events WHERE category LIKE '${lowerCasedCategory}'`;
        console.log(query);
        const result = await pool.query(query); // show searched events

        response.status(200).send(result.rows);
      }
    } catch (err) {
      console.log(err);
      response.sendStatus(500);
    }
  };

  const getEventById = async (request, response) => {
    const eventId = request.params.eventId;
    const event = await pool.query(
      `select 
        *
        from events c
        where c.id = $1 `,
      [eventId]
    );
    return response.status(200).json(event.rows);
  };

  const postNewMessege = async (request, response) => {
    const newMessege = request.body;
    const currentTme = new Date().toLocaleString();

    const result = await pool.query(
      `INSERT INTO messages (user_id, event_id, content, times_tamp)
        VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [newMessege.user_id, newMessege.event_id, newMessege.content, currentTme]
    );

    const responseBody = { messegeId: result.rows[0].id };
    return response.status(201).json({
      status: "messege Successfully created.",
      newMessegeId: responseBody.messegeId,
      time: currentTme,
    });
  };

  const postNewUserBooking = async (request, response) => {
    try {
      const newBooking = request.body;

      const { user_email: userEmail } = newBooking;
      const { hostel_id: hostelId } = newBooking;

      const emailQuery = await pool.query(
        `select u.id from users u where u.user_email = $1`,
        [userEmail]
      );

      const hostelIdQuery = await pool.query(
        `select * from hostels h where h.id = $1`,
        [hostelId]
      );

      const hostelIdResult = hostelIdQuery.rows[0];

      if (emailQuery.rows.length === 0) {
        return response.status(400).json({
          error: "User doesen't exists.",
        });
      } else if (!hostelIdResult) {
        return response.status(400).json({
          error: "Hostel Id doesen't exists.",
        });
      } else {
        const userId = emailQuery.rows[0].id;

        const result = await pool.query(
          `INSERT INTO bookings (
        user_id, 
        hostel_id, 
        activation_date, 
        deactivation_date)
        VALUES ($1, $2, $3, $4)`,
          [
            userId,
            newBooking.hostel_id,
            newBooking.activation_date,
            newBooking.deactivation_date,
          ]
        );

        return response.status(201).json({
          status: "User Activation Successful.",
        });
      }
    } catch (error) {
      console.log(error);
      response
        .status(400)
        .send(
          `Please ckeck your informations. Yor have the following issue ${error}`
        );
    }
  };

  //

  //   const result1 = await pool.query(
  //     `select p.user_email from participants p where p.user_email=$1`,
  //     [newUserEmail]
  //   );
  //   const result2 = await pool.query(
  //     `select p.user_email from participants p
  //     inner join events e on e.id=p.event_id
  //     where p.event_id=$1 and p.user_email=$2`,
  //     [eventId, newUserEmail]
  //   );

  //   console.log(result2.rows.length);

  //   if (result.rows.length === 0) {
  //     return res.status(400).send("Event Id does not exist.");
  //   }
  //   if (!newUserEmail) {
  //     return res.status(400).send("Please provide user email.");
  //   } else if (result1.rows.length > 0) {
  //     return res.status(409).send("Email is already exist");
  //   } else if (result2.rows.length > 0) {
  //     return res.status(409).send("Email is already exist");
  //   }

  //   const insertNewQuery = `insert into participants (event_id, user_id) values ($1, $2) returning id`;
  //   await pool.query(insertNewQuery, [eventId, userId]);
  //   res.status(200).send("Participant is Created!");
  // } catch (err) {
  //   console.log(err);
  // }
  // };

  // parameters (event_id, user_email)
  const addParticipantToEvent = async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const userEmail = req.body.user_email;

      console.log(eventId);
      console.log(userEmail);

      const queryResult = await pool.query(
        `select u.id from users u where u.user_email=$1`,
        [userEmail]
      );
      if (!eventId || !userEmail) {
        return res.status(400).send("Either event id or user email is empty");
      }

      const registerResult = queryResult.rows[0];

      if (!registerResult) {
        return res.status(200).send("Email address is not registered yet");
      }

      const userId = queryResult.rows[0].id;
      console.log(userId);

      const insertNewQuery = `insert into participants (event_id, user_id) values ($1, $2) returning id`;
      await pool.query(insertNewQuery, [eventId, userId]);
      res.status(200).send("Participant is Created!");
    } catch (err) {
      return res
        .status(400)
        .send("Email address is already exist in the following event");
    }
  };

  return {
    postNewEvent,
    getEvents,
    getEventById,
    postNewMessege,

    postNewUserBooking,
    addParticipantToEvent,
  };
};

module.exports = api;
