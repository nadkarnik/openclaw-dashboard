#!/usr/bin/env node

/**
 * OpenClaw Data Refresh Script
 * 
 * This script is called by OpenClaw assistant to populate dashboard data.
 * It writes JSON files that the dashboard server reads.
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

async function writeData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Updated ${filename}`);
}

async function main() {
  // Data will be passed as command-line arguments in JSON format
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node refresh-data.js <dataType> <jsonData>');
    console.log('Data types: sessions, subagents, status, history');
    process.exit(1);
  }
  
  const dataType = args[0];
  const jsonData = args.slice(1).join(' ');
  
  try {
    const data = JSON.parse(jsonData);
    await writeData(`${dataType}.json`, data);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
