exports.extractObjectFromPostbackData = (data) => {
  const dataArr = data.split('&')
  let dataObj = {}
  for(let i = 0 ; i < dataArr.length ; i++){
    let key = dataArr[i].split('=')[0]
    let value = dataArr[i].split('=')[1]
    dataObj[key] = value
  }

  return dataObj;
}