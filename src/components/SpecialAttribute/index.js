import React, { PureComponent } from 'react'
import { Button, Card, Form, Row, Icon, Col, Switch, Empty, Drawer } from 'antd';
import DAinput from "../DAinput";
import DApvcinput from '../DApvcinput.js/index'
import DAselect from '../DAseclect';
import styles from "./index.less"
import CodeMirrorForm from "../../components/CodeMirrorForm"

@Form.create()

export default class SpecialAttribute extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            codemirrorValue:''
        }
    }
    componentDidMount(){
    }
    drawerShow = (val) => {
        this.setState({
            codemirrorValue:val.attribute_value,
            visible: true,
        })
    }
    onClose = () => {
        this.setState({
            visible: false,
        });
    }

    render() {
        const { codemirrorValue } = this.state
        const { form, value } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;
        
        return (
            <Card title="特殊属性" style={{ marginBottom: '10px' }}>

                {value && value.length > 0 ? (
                    value.map((item, index) => {
                        return <Row key={index} className={styles.rowstyle}>
                            <Col span={4} className={styles.colstyle}>{item.name ? item.name : "-"}:</Col>
                            <Col span={20} className={styles.colstyleone}>
                                {item.save_type && item.save_type === "json" &&
                                    <>
                                        {item.attribute_value && 
                                        item.attribute_value.length > 0 && 
                                        Object.keys(JSON.parse(item.attribute_value)).map((val, numindex) => {
                                            return <div key={numindex} className={styles.divstyle}>
                                                <span>{val}</span>
                                                <span>{JSON.parse(item.attribute_value).[val]}</span>
                                            </div>
                                        })}

                                    </>
                                }
                                {item.save_type && item.save_type === "yaml" &&
                                    <div className={styles.drawerstyle}>
                                        <Button
                                            onClick={()=>this.drawerShow(item)}
                                        >查看详情
                                        </Button>
                                        <Drawer
                                            width={500}
                                            title={item.name ? item.name : "-"}
                                            placement="right"
                                            closable={false}
                                            onClose={this.onClose}
                                            visible={this.state.visible}
                                        >
                                             <CodeMirrorForm
                                                setFieldsValue={setFieldsValue}
                                                Form={Form}
                                                style={{ marginBottom: '20px' }}
                                                getFieldDecorator={getFieldDecorator}
                                                name={"selectval"}
                                                data={codemirrorValue || ''}
                                                mode={'yaml'}
                                                isUpload={false}
                                                disabled={true}
                                            />
                                        </Drawer>
                                    </div>
                                }
                                {item.save_type && item.save_type === "string" &&
                                    <div className={styles.divstyle}>
                                        {item.attribute_value ? item.attribute_value : "-" }
                                    </div>
                                }

                            </Col>
                        </Row>
                    })
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
                }
            </Card >
        )
    }
}
