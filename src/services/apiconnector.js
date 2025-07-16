import axios from 'axios'

//generic method to call frontend

//create axios for fetching api
export const axiosInstance=axios.create({});

export const apiConnector=(method,url,bodyData,headers,params)=>{
    return axiosInstance({
        method:`${method}`,
          url:`${url}`,
         data:bodyData ?bodyData:null,
        headers: headers ? headers : { "Content-Type": "application/json" },
         params: params ? params :null,

    })
    

}