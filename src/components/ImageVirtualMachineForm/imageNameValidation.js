const OCI_IMAGE_TAG_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

const resetImageSourceFields = (form, imageSource) => {
  form.resetFields(['image_name']);
  form.setFieldsValue({
    imagefrom: imageSource,
    asset_id: ''
  });
};

module.exports = {
  OCI_IMAGE_TAG_PATTERN,
  resetImageSourceFields
};
