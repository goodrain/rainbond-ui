import React, { PureComponent } from 'react'
import { Button, Card, Form, Row, Icon, Col, Switch, Empty, Drawer, Tooltip } from 'antd';
import DAinput from "../DAinput";
import DApvcinput from '../DApvcinput'
import styles from "./index.less"
import CodeMirrorForm from "../../components/CodeMirrorForm"

@Form.create()

export default class SpecialAttribute extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            drawerTitle:'',
            codemirrorValue:''
        }
    }
    componentDidMount(){
    }
    drawervalShow = (val) => {
        this.setState({
            drawerTitle:val.name,
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
        const { codemirrorValue, drawerTitle } = this.state
        const { form, value } = this.props;
        const yamlIcon = (
            <svg 
                t="1658480171057" 
                class="icon" 
                viewBox="0 0 1024 1024"
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                p-id="1600" 
                width="48" 
                height="48"
            >
                <path
                    d="M354.40128 0c-87.04 0-157.44 70.55872-157.44 157.59872v275.68128H78.72c-21.6576 0-39.36256 17.69984-39.36256 39.36256v236.31872c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.24128v118.08256c0 87.04 70.4 157.59872 157.44 157.59872h472.63744c87.04 0 157.59872-70.55872 157.59872-157.59872V315.0336c0-41.74848-38.9888-81.93024-107.52-149.27872l-29.11744-29.12256L818.87744 107.52C751.5392 38.9888 711.39328 0 669.59872 0H354.4064z m0 78.72h287.20128c28.35456 7.0912 27.99616 42.1376 27.99616 76.8v120.16128c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.07744c39.38816 0 78.87872-0.0256 78.87872 39.36256v512c0 43.32032-35.55328 78.87872-78.87872 78.87872H354.4064c-43.32544 0-78.72-35.5584-78.72-78.87872v-118.08256h393.91744c21.66272 0 39.36256-17.69472 39.36256-39.35744V472.64256c0-21.66272-17.69984-39.36256-39.36256-39.36256H275.68128V157.59872c0-43.32032 35.39456-78.87872 78.72-78.87872zM261.2736 506.39872h20.16256l65.28 176.64h-23.04l-19.2-54.71744h-65.28l-19.2 54.71744h-23.04l64.31744-176.64z m-181.43744 0.96256h23.99744l40.32 89.27744 41.28256-89.27744h23.99744l-53.76 107.52v68.15744h-22.07744v-67.2l-53.76-108.47744z m290.87744 0h32.64l49.92 143.03744h0.96256l48.95744-143.03744h33.60256v175.67744h-22.08256v-106.55744c0-10.88 0.32256-26.56256 0.96256-47.04256h-0.96256l-52.79744 153.6h-19.2l-52.80256-153.6h-0.95744c1.28 22.4 1.92 38.72256 1.92 48.96256v104.63744h-20.16256V507.36128z m214.08256 0h22.07744v155.52h69.12v20.15744H584.8064V507.36128z m-312.96 23.04c-1.92 8.96-4.80256 18.23744-8.64256 27.83744l-17.28 50.88256h51.84l-18.23744-50.88256c-3.84-10.88-6.4-20.15744-7.68-27.83744z" 
                    p-id="1601" 
                    data-spm-anchor-id="a313x.7781069.0.i0"
                    class="selected" 
                    fill="#707070"
                >
                </path>
            </svg>
        )
        const { getFieldDecorator, setFieldsValue } = form;
        
        return (
            <Card title="特殊属性" style={{ marginBottom: '10px' }}>

                {value && value.length > 0 ? (
                    value.map((item, index) => {
                        return <Row key={index} className={styles.rowStyle}>
                            <Col span={4} className={styles.colStyle}>{item.name ? item.name : "-"}:</Col>
                            <Col span={20} className={styles.colStyleOne}>
                                {item.save_type && item.save_type === "json" &&
                                    <>
                                        {item.attribute_value && 
                                        item.attribute_value.length > 0 && 
                                        Object.keys(JSON.parse(item.attribute_value)).map((val, numindex) => {
                                            return <Tooltip placement="top" title={<><p>Key: {val}</p><p>Value:  {JSON.parse(item.attribute_value).[val]}</p></>} key={numindex}>
                                            <div className={styles.tooltip_style}>
                                                <span>{val}</span>
                                                <span>{JSON.parse(item.attribute_value).[val]}</span>
                                            </div>
                                            </Tooltip>
                                        })}

                                    </>
                                }
                                {item.save_type && item.save_type === "yaml" &&
                                <>
                                    <div className={styles.yamlFiles_style }>
                                        {yamlIcon}&nbsp;&nbsp;&nbsp;&nbsp;该配置以yaml文件形式存储,请点击右侧按钮查看详情。
                                        <Button
                                            style={{marginLeft:'100px'}}
                                            onClick={()=>this.drawervalShow(item)}
                                        >查看详情
                                        </Button>
                                    </div>
                                        <Drawer
                                            width={500}
                                            title={drawerTitle}
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
                                    </>
                                }
                                {item.save_type && item.save_type === "string" &&
                                <Tooltip placement="top" title={item.attribute_value ? item.attribute_value : "-" }>
                                    <div className={styles.tooltip_style} style={{padding:"10px 20px"}}>
                                        {item.attribute_value ? item.attribute_value : "-" }
                                    </div>
                                </Tooltip>
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
