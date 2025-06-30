const axios = require('axios');
const { set } = require('mongoose');

const getLanguageById =(language)=>{
    const languages ={
        "c++":54,
        "java":62,
        "javaScript":63 
    }

    return languages[language.toLowerCase()] || null;
}

const submitBatch = async (submissions) => {
    const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'true'
  },
  headers: {
    'x-rapidapi-key': '5c0669cdc5msh6d133bea792f980p11291cjsncfac8c1ebd02',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    submissions: [
      {
        language_id: 46,
        source_code: 'ZWNobyBoZWxsbyBmcm9tIEJhc2gK'
      },
      {
        language_id: 71,
        source_code: 'cHJpbnQoImhlbGxvIGZyb20gUHl0aG9uIikK'
      },
      {
        language_id: 72,
        source_code: 'cHV0cygiaGVsbG8gZnJvbSBSdWJ5IikK'
      }
    ]
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		console.log(response.data);
	} catch (error) {
		console.error(error);
	}
}

fetchData();
}


const waiting =async(timer)=>{
  setTimeout(() => {
    return 1;
  }, timer);
}


const submitToken = async(resultTokens)=>{


const options = {
  method: 'GET',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    tokens: resultTokens.join(","),
    base64_encoded: 'true',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': 'ce9e2c394bmshbe7db56a2332644p1a4a3djsne710a9cdd1cc',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}


while(true){
const result = await fetchData();

const IsResultObtained = result.submmissions.every((r)=> r.status.id > 2);

if(IsResultObtained){
  return result.submissions;
}

await waiting(1000);
}
} 



module.exports = {getLanguageById,submitBatch};



//

