/**
 * Demo script to test AXON logging framework
 * Run with: npx ts-node demo.ts
 */

import { Logger, LogLevel } from './src/logger';
import { TOONSerializer } from './src/serializer';
import { TOONParser } from './src/parser';
import * as fs from 'fs';

async function runDemo() {
  console.log('🚀 AXON Demo - Testing logging framework\n');

  // ============================================
  // 1. Basic Logging
  // ============================================
  console.log('📝 Test 1: Basic Logging');
  const logger = new Logger({
    outputPath: './logs/demo.txt',
    level: LogLevel.DEBUG,
    bufferSize: 5,
    flushInterval: 0 // Disable auto-flush for demo
  });

  logger.info('Application started', { version: '1.0.0', env: 'demo' });
  logger.debug('Debug message with details', { userId: 123, action: 'login' });
  logger.warn('Warning: High memory usage', { memory: '85%', threshold: '80%' });
  logger.error('Error occurred', { code: 'ERR_001', message: 'Connection failed' });

  console.log('✅ Logged 4 entries\n');

  // ============================================
  // 2. Section Markers
  // ============================================
  console.log('📍 Test 2: Section Markers');
  logger.mark('authentication-start');
  logger.info('User authentication initiated', { username: 'alice' });
  logger.info('Checking credentials');
  logger.info('Authentication successful');
  logger.mark('authentication-end');

  console.log('✅ Added section markers\n');

  // ============================================
  // 3. Global Metadata
  // ============================================
  console.log('🌍 Test 3: Global Metadata');
  logger.setGlobalMetadata({ 
    appName: 'AXON-Demo', 
    instanceId: 'demo-001',
    region: 'us-east-1'
  });

  logger.info('Request received', { endpoint: '/api/users', method: 'GET' });
  logger.info('Request processed', { duration: '45ms', status: 200 });

  logger.clearGlobalMetadata();
  logger.info('Global metadata cleared');

  console.log('✅ Global metadata working\n');

  // ============================================
  // 4. Flush and Read Logs
  // ============================================
  console.log('💾 Test 4: Flush and Read Logs');
  await logger.flush();
  console.log('✅ Flushed logs to file\n');

  // Read the log file
  const logContent = fs.readFileSync('./logs/demo.txt', 'utf-8');
  console.log('📄 Log file content (first 500 chars):');
  console.log('─'.repeat(60));
  console.log(logContent.substring(0, 500) + '...');
  console.log('─'.repeat(60));
  console.log();

  // ============================================
  // 5. TOON Serialization Demo
  // ============================================
  console.log('🔄 Test 5: TOON Serialization');
  const serializer = new TOONSerializer({
    delimiter: ',',
    omitNullValues: true,
    fieldAliases: {
      timestamp: 't',
      userId: 'uid',
      userName: 'uname'
    },
    maxDepth: 10
  });

  const testData = {
    timestamp: Date.now(),
    userId: 12345,
    userName: 'alice',
    profile: {
      email: 'alice@example.com',
      age: 30,
      active: true
    },
    tags: ['admin', 'verified', 'premium']
  };

  const toonOutput = serializer.serialize(testData);
  console.log('Original object:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\nTOON format:');
  console.log('─'.repeat(60));
  console.log(toonOutput);
  console.log('─'.repeat(60));

  // Token comparison
  const jsonTokens = JSON.stringify(testData).split(/\s+/).length;
  const toonTokens = toonOutput.split(/\s+/).length;
  const reduction = ((jsonTokens - toonTokens) / jsonTokens * 100).toFixed(1);

  console.log(`\n📊 Token comparison:`);
  console.log(`   JSON tokens: ${jsonTokens}`);
  console.log(`   TOON tokens: ${toonTokens}`);
  console.log(`   Reduction: ${reduction}%`);
  console.log();

  // ============================================
  // 6. Tabular Array Demo
  // ============================================
  console.log('📊 Test 6: Tabular Array Format');
  const users = [
    { id: 1, name: 'Alice', age: 28, active: true },
    { id: 2, name: 'Bob', age: 35, active: true },
    { id: 3, name: 'Carol', age: 42, active: false }
  ];

  const tabularOutput = serializer.serialize(users);
  console.log('Uniform array (tabular format):');
  console.log('─'.repeat(60));
  console.log(tabularOutput);
  console.log('─'.repeat(60));
  console.log();

  // ============================================
  // 7. Round-trip Test
  // ============================================
  console.log('🔁 Test 7: Round-trip (Serialize → Parse)');
  const parser = new TOONParser();
  const parsed = parser.parse(toonOutput);

  console.log('Parsed back to object:');
  console.log(JSON.stringify(parsed, null, 2));

  const isEqual = JSON.stringify(testData) === JSON.stringify(parsed);
  console.log(`\n✅ Round-trip ${isEqual ? 'SUCCESSFUL' : 'FAILED'}`);
  console.log();

  // ============================================
  // 8. Log Level Filtering
  // ============================================
  console.log('🔍 Test 8: Log Level Filtering');
  const filteredLogger = new Logger({
    outputPath: './logs/filtered.txt',
    level: LogLevel.WARN, // Only WARN and above
    bufferSize: 10
  });

  filteredLogger.debug('This will be filtered out');
  filteredLogger.info('This will also be filtered out');
  filteredLogger.warn('This will appear');
  filteredLogger.error('This will also appear');

  await filteredLogger.flush();

  const filteredContent = fs.readFileSync('./logs/filtered.txt', 'utf-8');
  const lines = filteredContent.trim().split('\n').filter(l => l.length > 0);
  console.log(`✅ Filtered log has ${lines.length} entries (expected 2)`);
  console.log();

  // ============================================
  // 9. Performance Test
  // ============================================
  console.log('⚡ Test 9: Performance Test');
  const perfLogger = new Logger({
    outputPath: './logs/perf.txt',
    level: LogLevel.INFO,
    bufferSize: 100
  });

  const startTime = Date.now();
  const numLogs = 1000;

  for (let i = 0; i < numLogs; i++) {
    perfLogger.info(`Log entry ${i}`, {
      iteration: i,
      timestamp: Date.now(),
      data: { value: Math.random() }
    });
  }

  await perfLogger.flush();
  const duration = Date.now() - startTime;

  console.log(`✅ Logged ${numLogs} entries in ${duration}ms`);
  console.log(`   Average: ${(duration / numLogs).toFixed(2)}ms per log`);
  console.log(`   Throughput: ${(numLogs / (duration / 1000)).toFixed(0)} logs/sec`);
  console.log();

  // ============================================
  // 10. Cleanup
  // ============================================
  console.log('🧹 Cleanup');
  await logger.close();
  await filteredLogger.close();
  await perfLogger.close();

  console.log('✅ All loggers closed\n');

  // ============================================
  // Summary
  // ============================================
  console.log('═'.repeat(60));
  console.log('✨ AXON Demo Complete!');
  console.log('═'.repeat(60));
  console.log('📁 Log files created:');
  console.log('   - ./logs/demo.txt (main demo log)');
  console.log('   - ./logs/filtered.txt (filtered log)');
  console.log('   - ./logs/perf.txt (performance test log)');
  console.log('\n💡 Check the log files to see TOON format in action!');
  console.log('═'.repeat(60));
}

// Run the demo
runDemo().catch(console.error);
