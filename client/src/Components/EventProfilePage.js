import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "react-bootstrap/Card";

import { SearchBar } from "./SeachBar";
import { Link } from "react-router-dom";
import CardsProfile from "./CardProfile";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function EventProfilePage() {
  const [events, setEvents] = useState([]);

  let { id } = useParams();

  useEffect(() => {
    const url = `http://localhost:5000/events/${id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((error) => {
        console.error(error);
      });
  }, [id]);

  return (
    <div>
      {events.map((event) => {
        return <CardsProfile event={event} />;
      })}
    </div>
  );
}
