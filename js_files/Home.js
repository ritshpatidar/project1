import React, { useEffect } from "react";
import {Text, View} from "react-native";
import {Button} from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';

export default class Home extends React.Component {
    constructor(props){
        super(props);
        this.LOGGED_IN_KEY = "LOGGED_IN";
        this.TOKEN_KEY = "TOKEN";
        this.PROFILE_UPDATED_KEY = "PROFILE_UPDATED";
    }

    erase(){
        AsyncStorage.setItem(
            this.TOKEN_KEY,
            JSON.stringify({isEmpty: true})
        ).then(()=>{
            console.log("came herew");
            return AsyncStorage.setItem(
                this.LOGGED_IN_KEY,
                "false"
            );
        }).then(()=>{
            return AsyncStorage.setItem(
                this.PROFILE_UPDATED_KEY,
                "false"
            );
        }).then(()=>{
            console.log("erased");
            this.props.updateLoginProfileState(false, false);
        }).catch(error=>{
            console.log("Error while erasing");
        });
    }

    render(){
        return (
            <View style={{flex:1, justifyContent:'center', alignItems: 'center'}}>
                <Text>This is Home Page</Text>
                <Button style={{elevation:10, alignSelf: "center", backgroundColor:'#F57C00', marginTop: "8%"}} rounded
                    onPress={()=>{
                        this.erase();
                    }}
                >
                    <Text style={{color:"white", paddingLeft:"10%", paddingRight:'10%' ,fontSize:16}}>Erase Session Data</Text>
                </Button>
            </View>
        );
    }
}

/*
{"access_token": "64e53ebad9a176b43c56ee16883b7192dec152b9", "authby": "0", "canbedeleted": "NO", "canbedeletedid": "NO", "cdt": null, "client_id": "testclient", "contactno": "", "cuid": "0", "ddt": null, "departmentid": "0", "designationid": "0", "emailid": "bhuvnesh.maheta@gmail.com", "expires": 1605182365, "fullname": "BHUVNESH MAHETA", "isactive": "YES", "isactiveid": "YES", "isapplicanttype": "NO", "isauth": "NO", "isauthid": "NO", "isdeleted": "NO", "isdeletedid": "NO", "isemailalert": "NO", "isemailalertid": "NO", "isotploginallowed": "YES", "isotploginallowedid": "YES", "isvisible": "YES", "isvisibleid": "YES", "mdt": null, "mobileno": "9376038883", "muid": "0", "password": "$2y$10$QJzhW8j6hV9iqcAMFHXh9OeasVyClswRhtGVn8.6NgrmCI4mX9DV.", "pusertype": null, "pusertypeid": "0", "pwd": "", "scope": null, "user_id": "3", "userid": "3", "username": "bhuvneshmaheta", "usertype": "SUPER ADMIN", "usertypeid": "3", "usertypeisdeleted": "No", "verificationcode": "1"}
*/