// In this.DOM/tests/test_node_env.js
import thisDOM from '../index.js'; 

// Testing workflow for node...
thisDOM('./html.html').then(processedDOM => {
    console.log('Processed DOM:', processedDOM);
}).catch(error => {
    console.error('Error processing DOM:', error);
});