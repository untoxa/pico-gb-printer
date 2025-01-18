
const today = (date: Date, delim: string): string  => {
  return ((date.getDate() < 10)?"0":"") + date.getDate() + delim + (((date.getMonth()+1) < 10)?"0":"") + (date.getMonth()+1) + delim + date.getFullYear();
}

const timeNow = (date: Date, delim: string): string  => {
  return ((date.getHours() < 10)?"0":"") + date.getHours() + delim + ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + delim + ((date.getSeconds() < 10)?"0":"") + date.getSeconds();
}

const format = (str: string, ...rest: string[]): string => {
  var formatted = str;
  for (var i = 0; i < rest.length; i++) {
    var regexp = new RegExp('\\{'+i+'\\}', 'gi');
    formatted = formatted.replace(regexp, rest[i]);
  }
  return formatted;
};


export const  downloadImage = async (image: HTMLImageElement) => {
  var datetime = new Date();
  const file_name = format("image_{0}_{1}.png", today(datetime, "-"), timeNow(datetime, "-"));
  // Fallback to simple download
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = function () {
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(xhr.response);
    a.download = file_name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  xhr.open("GET", image.src);
  xhr.send();
}
