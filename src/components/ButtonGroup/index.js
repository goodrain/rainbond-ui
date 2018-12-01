import React, { Component } from 'react';
import {
    Form,
    Button,
    Select,
    Input,
  } from "antd";
export const singleBotton=(type,title,onClickName) =>{
    return(  
        <Button onClick={`this.props.${onClickName}`} type={type}>
            {title}
        </Button>
  )
}
