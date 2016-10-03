# webdrawquiz

A small web service that enables the creation of online quizzes where
answers are submitted as small drawings.

The service is designed for both desktop computers and mobile devices.

There are two separate roles; hosts and contestants. There can only be
one host for every quiz, but there can be multiple contestants. Their
workflows are different, but they both follow the same basic game plan:

 1. A pre-game period, where new contestants can join the game
 2. A question is posited to the contestants
 3. The contestants post responses, which are marked by the host
 4. The host decides to reveal the answer to the question and reward points
 5. Repeat 2-4 until there are no more questions left to answer
 6. Conclude the game, revealing the winner

## Installation

At the current stage of development, MongoDB has been chosen as a sole
database provider. The access is unauthenticated by default, but an
alternative connection URI can be provided as a `MONGO_CONNECT`
environment variable.

Dependencies are provided using `npm`. Run the following to install
depenencies:

    npm install . 

## Usage

The executable is located in `bin/www`. Run it with the `node`
command line utility, providing the port it should listen for
connections as an environment variable:

    PORT=7890 node bin/www

The application should be live at:

    http://localhost:PORT/

## Implementation

**TL;DR:**
The core of the game is facilitated by an authenticated WebSocket API,
the tokens for which are provided through an extremely basic HTTP API.

The host creates a game using the `/create/` API. The details for the
game are submitted via POST request to `/create/` as well, returning
the host's session ID and a unique four digit code, presented to the
host. Contestants fill in the `/join/` form with this code and a unique
name that will be shown to the host. The form will also be submitted
via POST request to `/join/`, returning a contestant session ID.

The host will be redirected to `/admin/` and the contestants will be
redirected to `/play/`. Both the host and the contestant connect using
WebSockets directly to the server, which also facilitates passing
messages between the host and the contestants. The host decides when to
begin the game, when to reveal the answer and when to move on to the
next question. The host also marks the contestant's responses.
The contestants are tasked with creating responses to the questions
presented to them using either a mouse or touch device to make a
drawing which is then submitted to the server. Contestants can also
submit later responses, but these will erase the previous responses
and will be required to be marked by the host again.

The WebSocket API is documented (although not extremely meticulously)
in `/doc/api.md`.

The game ends when there are no more questions to present. Both the
host and the contestants are relieved of control. The host can announce
the winner, and each contestant is provided with their accumulated
scores.

## Planned Features

This application was originally designed for a specific request, but I
have designed the system as to allow for reasonable changes. Some of
them may include:

 - Exposing per-question score and time limits in the UI (already in 
 the API)
 - Allowing for responses to stop automatically when all contestants
 have submitted one response
 - Multiple choice questions
 - Free-form questions with more than one answer
 - Bonus points for selected answers
