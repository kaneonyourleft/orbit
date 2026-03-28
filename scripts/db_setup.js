const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esxansmlwwziojoppanw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeGFuc21sd3d6aW9qb3BwYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDg1OTEsImV4cCI6MjA5MDAyNDU5MX0.uRqhqx6XNgBKZJh0Ay4j7pf0W67PGQVbFh7DacRKPvw';
const supabase = createClient(supabaseUrl, supabaseKey);

const tableId = '6fd666e1-9690-44ea-9398-bd3833533b4a';

async function main() {
  console.log('--- Cleaning Up Fields ---');
  const { error: deleteFieldsError } = await supabase
    .from('fields')
    .delete()
    .eq('table_id', tableId)
    .in('name', ['New Field 6', 'New Field 7']);
  if (deleteFieldsError) {
    console.error('Delete fields error:', deleteFieldsError);
  } else {
    console.log('Deleted New Field 6, 7');
  }

  console.log('--- Inserting Due Date Field ---');
  let fieldData;
  const { data: insertedField, error: insertFieldError } = await supabase
    .from('fields')
    .insert({ table_id: tableId, name: 'Due Date', type: 'date', "order": 5 })
    .select()
    .single();
  
  if (insertFieldError) {
    console.error('Insert Due Date error:', insertFieldError);
    // If it already exists, fetch it
    const { data: existingField } = await supabase
      .from('fields')
      .select('id')
      .eq('table_id', tableId)
      .eq('name', 'Due Date')
      .single();
    if (existingField) {
      console.log('Due Date field already exists:', existingField.id);
      fieldData = existingField;
    }
  } else {
    fieldData = insertedField;
    console.log('Inserted Due Date field:', fieldData.id);
  }

  const dueDateFieldId = fieldData?.id;

  console.log('--- Cleaning Up Rows ---');
  const { error: deleteRowsError } = await supabase
    .from('rows')
    .delete()
    .eq('table_id', tableId);
  if (deleteRowsError) {
    console.error('Delete rows error:', deleteRowsError);
  } else {
    console.log('Deleted all rows for table');
  }

  if (dueDateFieldId) {
    console.log('--- Inserting Sample Rows ---');
    const samples = [
      'Mobile API Architecture Redesign',
      'Q3 User Research Synthesis',
      'Dark Mode Global Stylesheet',
      'Payment Gateway Integration',
      'Infrastructure Audit 2025'
    ];

    const today = new Date();

    console.log('--- Fetching all fields for the table ---');
    const { data: allFields } = await supabase
      .from('fields')
      .select('*')
      .eq('table_id', tableId);
    
    if (!allFields) {
        console.error('Failed to fetch fields');
        return;
    }

    const taskNameField = allFields.find(f => f.name.toLowerCase().includes('name'));
    const statusField = allFields.find(f => f.name === 'Status');
    const priorityField = allFields.find(f => f.name === 'Priority');
    const ownerField = allFields.find(f => f.name === 'Owner');

    const finalRows = samples.map((name, i) => {
      const date = new Date();
      date.setDate(today.getDate() + (i - 2)); 
      const dateStr = date.toISOString().split('T')[0];
      
      const data = {};
      if (taskNameField) data[taskNameField.id] = name;
      if (dueDateFieldId) data[dueDateFieldId] = dateStr;
      
      // Mockup status/priority
      if (statusField) {
        const statuses = ['In Progress', 'Planned', 'Stuck', 'Completed', 'Done'];
        data[statusField.id] = statuses[i % statuses.length];
      }
      if (priorityField) {
        const priorities = ['Critical', 'High', 'Medium', 'Low', 'Medium'];
        data[priorityField.id] = priorities[i % priorities.length];
      }
      if (ownerField) {
        const owners = ['Kane', 'Alice', 'Bob', 'Charlie', 'Dave'];
        data[ownerField.id] = owners[i % owners.length];
      }

      return {
        table_id: tableId,
        order: i,
        data
      };
    });

    const { error: insertRowsError } = await supabase
      .from('rows')
      .insert(finalRows);
    
    if (insertRowsError) {
      console.error('Insert rows error:', insertRowsError);
    } else {
      console.log('Inserted 5 sample rows');
    }
  }

  process.exit(0);
}

main().catch(console.error);
