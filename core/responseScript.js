const JsonBuilder = require('./jsonBuilder');
const { isJson } = require('./fileHelpers');

module.exports = async (scenario, actualResponse, configs) => {
  if (!scenario.expected) {
    scenario.result.state = 'failed';
    scenario.result.context.push({
      error: `No expected results!`
    });
    return;
  }

  if (!actualResponse) {
    scenario.result.state = 'failed';
    scenario.result.context.push({
      error: `Response is undefined! Check your request then try again.`
    });
    return;
  }

  if (scenario.expected && actualResponse) {
    let expectedResponse = scenario.expected;

    if (expectedResponse.status) {
      if (actualResponse.status != expectedResponse.status) {
        scenario.result.state = 'failed';
        scenario.result.context.push({
          error: "Response status is incorrect!",
          actual: actualResponse.status,
          expected: expectedResponse.status
        });
      }
    }

    if (expectedResponse.statusText) {
      if (actualResponse.statusText != expectedResponse.statusText) {
        scenario.result.state = 'failed';
        scenario.result.context.push({
          error: "Response status text is incorrect!",
          actual: actualResponse.statusText,
          expected: expectedResponse.statusText
        });
      }
    }

    if (expectedResponse.data) {
      for (const dataField of expectedResponse.data) {
        if (actualResponse.data) {
          let actualValue = actualResponse.data;

          if (dataField.path && isJson(actualResponse.data)) {
            let jb = new JsonBuilder(actualResponse.data);
            actualValue = jb.get(dataField.path);
          }

          // Equals
          if (dataField.equals) {
            let expectedValue = dataField.equals;
            if (actualValue !== expectedValue) {
              scenario.result.state = 'failed';
              scenario.result.context.push({
                error: "Field value is incorrect!",
                path: dataField.path,
                actual: actualValue,
                expected: expectedValue
              });
            }
          }

          // Contains
          if (dataField.contains) {
            let isFailed = false;
            if (actualValue instanceof Array) {
              if (!actualValue.includes(dataField.contains)) {
                isFailed = true;
              }
            } else {
              let regex = RegExp(dataField.contains, 'i');
              if (!regex.test(actualValue)) {
                isFailed = true;
              }
            }
            if (isFailed) {
              scenario.result.state = 'failed';
              scenario.result.context.push({
                error: "Field value is incorrect!",
                path: dataField.path,
                actual: actualValue,
                contains: dataField.contains
              });
            }
          }

          // NotContains
          if (dataField.notcontains) {
            let isFailed = false;
            if (actualValue instanceof Array) {
              if (actualValue.includes(dataField.notcontains)) {
                isFailed = true;
              }
            } else {
              let regex = RegExp(dataField.notcontains, 'i');
              if (regex.test(actualValue)) {
                isFailed = true;
              }
            }
            if (isFailed) {
              scenario.result.state = 'failed';
              scenario.result.context.push({
                error: "Field value is incorrect!",
                path: dataField.path,
                actual: actualValue,
                notcontains: dataField.notcontains
              });
            }
          }

          // Callback
          if (dataField.callback) {
            dataField.callback(dataField, actualValue, scenario);
          }
        } else {
          scenario.result.state = 'failed';
          scenario.result.context.push({
            error: "Field not found!"
          });
        }
      }
    }

  }

  return;
};
