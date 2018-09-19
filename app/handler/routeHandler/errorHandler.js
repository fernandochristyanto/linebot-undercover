module.exports = (err, req, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).send(err.signature)
    return
  } else if (err instanceof JSONParseError) {
    res.status(400).send(err)
    return
  }
  else {
    res.status(500).send(err)
    return
  }
}