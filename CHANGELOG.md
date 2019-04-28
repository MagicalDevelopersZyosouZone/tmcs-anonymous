# Changelog

## 0.1.0 - 2019-04-07

### Added

- TMCS Anonymous back-end server.
  - Basic key & session lifecycle management.
  - Basic message delivery.
- TMCS Anonymous front-end api.
  - Key-pair generation & message encryption/decryption.
  - User registration & server connection.
  - Contact request.
  - Message receiving & sending.
  - A simple console interactive front-end app "TMCS Anonymous @ Console".

## 0.2.0 - 2019-04-23

### Added

- Front-end UI with React.
  - Chatting screen.
  - Contact request handler.
  - Multi session switching.
  - User startup guide.
- Script for server build.
- README

### Changed

- Prevent server signature verification of each message packege.
- Support multi session for each user.
- Remove one-time invite link.

## 0.2.1 - 2019-04-23

### Added
- Client auto reconnect after disconnected from server.

## 0.2.2 - 2019-04-25

### Added
- Config file for back-end server.
- Responsive UI for mobile devices.