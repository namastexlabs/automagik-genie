const { UpdateEngine } = require('../../../lib/update/engine');
const { DiffEngine } = require('../../../lib/update/diff');
const { MergeEngine } = require('../../../lib/update/merge');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * REAL-WORLD DATA TESTING: Complex Agent Customizations
 * 
 * Tests the update system with realistic agent files containing:
 * - Complex business logic and custom workflows
 * - Embedded code blocks with various languages
 * - User customizations with proprietary information
 * - Large files with extensive documentation
 * - Mixed content types and formatting
 * - Unicode and special character handling
 */

describe('🌍 REAL-WORLD DATA: Complex Agent Customizations', () => {
  let testProjectPath;
  let updateEngine;
  let diffEngine;
  let mergeEngine;

  beforeEach(async () => {
    testProjectPath = await createTempDir('real-world-test-');
    updateEngine = new UpdateEngine({ projectPath: testProjectPath });
    diffEngine = new DiffEngine();
    mergeEngine = new MergeEngine();
  });

  describe('Complex Business Logic Preservation', () => {
    test('REAL-WORLD: Preserve complex business logic during updates', async () => {
      console.log('🎯 REAL-WORLD: Testing complex business logic preservation');
      
      // Create agent with sophisticated business logic
      const complexAgent = await createComplexBusinessAgent(testProjectPath);
      
      console.log(`📊 Created complex agent: ${complexAgent.stats.totalLines} lines, ${complexAgent.stats.codeBlocks} code blocks`);
      
      // Simulate template update that adds new sections but must preserve business logic
      const templateUpdate = `# Enhanced Development Agent

## Updated Role
Development agent with enhanced capabilities and new features.

## Core Instructions (Updated)
- Follow updated best practices and patterns
- Use new development frameworks and tools
- Implement enhanced error handling and validation
- Apply updated security guidelines

### New Feature: AI Code Review
Automatically review code for quality and security issues.

\`\`\`javascript
class AICodeReviewer {
  constructor() {
    this.rules = [
      'check_security_vulnerabilities',
      'validate_performance_patterns',
      'ensure_accessibility_compliance'
    ];
  }
  
  async reviewCode(codeContent) {
    const issues = [];
    
    for (const rule of this.rules) {
      const ruleResult = await this.applyRule(rule, codeContent);
      if (!ruleResult.passed) {
        issues.push(ruleResult.issue);
      }
    }
    
    return {
      passed: issues.length === 0,
      issues,
      recommendations: this.generateRecommendations(issues)
    };
  }
}
\`\`\`

<!-- USER_CUSTOMIZATION_START -->
${complexAgent.customContent}
<!-- USER_CUSTOMIZATION_END -->

## Additional Template Content
New workflows and processes added in the template update.

### Integration Guidelines (New)
- Connect with updated development tools
- Follow new deployment processes
- Use enhanced monitoring capabilities
`;

      // Test diff analysis
      const originalContent = await fs.readFile(complexAgent.filePath, 'utf-8');
      const diffAnalysis = await diffEngine.analyzeAgentChanges(
        'complex-business-agent',
        originalContent,
        templateUpdate
      );

      expect(diffAnalysis.userSections.length).toBeGreaterThan(0);
      expect(diffAnalysis.templateSections.length).toBeGreaterThan(0);
      expect(diffAnalysis.conflicts.length).toBe(0); // Should be no conflicts with marked sections
      
      console.log(`📊 Diff Analysis Results:`);
      console.log(`   User sections: ${diffAnalysis.userSections.length}`);
      console.log(`   Template sections: ${diffAnalysis.templateSections.length}`);
      console.log(`   Conflicts: ${diffAnalysis.conflicts.length}`);
      
      // Test merge execution
      const mergeResult = await mergeEngine.executeMerge(
        complexAgent.filePath,
        diffAnalysis,
        { 'Core Instructions': 'accept', 'AI Code Review': 'accept' },
        { dryRun: false }
      );

      expect(mergeResult.success).toBe(true);
      
      // Verify business logic preservation
      const mergedContent = await fs.readFile(complexAgent.filePath, 'utf-8');
      
      // Check that all custom business logic is preserved
      expect(mergedContent).toContain('class ProprietaryWorkflowEngine');
      expect(mergedContent).toContain('class CustomerDataProcessor');
      expect(mergedContent).toContain('API_KEY: process.env.PROPRIETARY_API_KEY');
      expect(mergedContent).toContain('executeCustomWorkflow');
      
      // Check that new template content was added
      expect(mergedContent).toContain('class AICodeReviewer');
      expect(mergedContent).toContain('Enhanced Development Agent');
      
      console.log('✅ Complex business logic preserved during template update');
      console.log(`📊 Merged file size: ${Math.round(mergedContent.length / 1024)}KB`);
    });

    test('REAL-WORLD: Handle multi-language code blocks', async () => {
      console.log('🎯 REAL-WORLD: Testing multi-language code block handling');
      
      const multiLangAgent = await createMultiLanguageAgent(testProjectPath);
      
      console.log(`📊 Created multi-language agent with ${multiLangAgent.languages.length} languages`);
      console.log(`   Languages: ${multiLangAgent.languages.join(', ')}`);
      
      // Template update that adds new language examples
      const templateWithNewLanguages = `# Multi-Language Development Agent

## Updated Instructions
Support for additional programming languages and frameworks.

### Python Integration (Updated)
\`\`\`python
# Enhanced Python integration
class EnhancedPythonHandler:
    def __init__(self):
        self.supported_versions = ['3.9', '3.10', '3.11', '3.12']
    
    async def execute_python_code(self, code, version='3.11'):
        # New enhanced execution logic
        return await self.run_in_sandbox(code, version)
\`\`\`

### New Language: Rust
\`\`\`rust
// New Rust support
use tokio::runtime::Runtime;

pub struct RustExecutor {
    runtime: Runtime,
}

impl RustExecutor {
    pub fn new() -> Self {
        Self {
            runtime: Runtime::new().unwrap(),
        }
    }
    
    pub async fn execute(&self, code: &str) -> Result<String, Box<dyn std::error::Error>> {
        // Rust code execution logic
        Ok("Execution completed".to_string())
    }
}
\`\`\`

<!-- PRESERVE_USER_CUSTOMIZATION -->
${multiLangAgent.customContent}
<!-- END_PRESERVE -->

### Additional Language Support
Support for Go, Swift, and Kotlin coming soon.
`;

      // Test preservation of existing code blocks
      const originalContent = await fs.readFile(multiLangAgent.filePath, 'utf-8');
      const diffResult = await diffEngine.analyzeAgentChanges(
        'multi-language-agent',
        originalContent,
        templateWithNewLanguages
      );

      expect(diffResult.confidence).toBe('high');
      
      // Verify all original languages are preserved in user sections
      const userSectionContent = diffResult.userSections.map(s => s.content).join('\n');
      
      for (const lang of multiLangAgent.languages) {
        expect(userSectionContent).toContain(`\`\`\`${lang}`);
        console.log(`✅ ${lang} code blocks preserved`);
      }
      
      // Verify new languages are in template sections
      const templateSectionContent = diffResult.templateSections.map(s => s.content).join('\n');
      expect(templateSectionContent).toContain('```rust');
      expect(templateSectionContent).toContain('class EnhancedPythonHandler');
      
      console.log('✅ Multi-language code blocks handled correctly');
    });
  });

  describe('Large File Processing', () => {
    test('REAL-WORLD: Handle very large agent files with extensive documentation', async () => {
      console.log('🎯 REAL-WORLD: Testing large file processing');
      
      const largeAgent = await createLargeDocumentationAgent(testProjectPath);
      
      console.log(`📊 Created large agent: ${largeAgent.stats.sizeKB}KB, ${largeAgent.stats.sections} sections`);
      
      // Test processing time and memory usage
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();
      
      const originalContent = await fs.readFile(largeAgent.filePath, 'utf-8');
      
      // Simulate template update for large file
      const templateUpdate = originalContent.replace(
        '# Comprehensive Documentation Agent',
        '# Enhanced Comprehensive Documentation Agent'
      ) + `

## New Template Section
This is a new section added by the template update.

### Performance Optimizations
- Improved parsing algorithms
- Enhanced memory management
- Optimized file processing

\`\`\`javascript
class PerformanceOptimizer {
  constructor() {
    this.cacheSize = 1000;
    this.cache = new Map();
  }
  
  optimize(content) {
    // Performance optimization logic
    return this.processWithCache(content);
  }
}
\`\`\`
`;

      const diffResult = await diffEngine.analyzeAgentChanges(
        'large-documentation-agent',
        originalContent,
        templateUpdate
      );

      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      
      const processingTime = endTime - startTime;
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💾 Memory delta: ${Math.round(memoryDelta / 1024 / 1024)}MB`);
      
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // Memory usage should be reasonable
      
      expect(diffResult.success).toBe(true);
      expect(diffResult.templateSections.length).toBeGreaterThan(0);
      
      console.log('✅ Large file processed successfully within performance limits');
    });

    test('REAL-WORLD: Stream processing for memory efficiency', async () => {
      console.log('🎯 REAL-WORLD: Testing stream processing for large files');
      
      // Create extra large file for stream testing
      const extraLargeAgent = await createExtraLargeAgent(testProjectPath);
      
      console.log(`📊 Created extra large agent: ${extraLargeAgent.stats.sizeKB}KB`);
      
      // Mock stream-based processing
      const processFileInChunks = async (filePath, chunkSize = 64 * 1024) => {
        const chunks = [];
        const fileHandle = await fs.open(filePath, 'r');
        
        try {
          let position = 0;
          const buffer = Buffer.alloc(chunkSize);
          
          while (true) {
            const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, position);
            
            if (bytesRead === 0) break;
            
            const chunk = buffer.slice(0, bytesRead).toString('utf-8');
            chunks.push(chunk);
            position += bytesRead;
            
            // Monitor memory usage during streaming
            if (chunks.length % 100 === 0) {
              const memUsage = process.memoryUsage();
              console.log(`   Processed ${chunks.length} chunks, memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
            }
          }
          
          return chunks.join('');
          
        } finally {
          await fileHandle.close();
        }
      };

      const startTime = Date.now();
      const initialMemory = process.memoryUsage();
      
      const streamedContent = await processFileInChunks(extraLargeAgent.filePath);
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      
      const processingTime = endTime - startTime;
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`⏱️ Stream processing time: ${processingTime}ms`);
      console.log(`💾 Memory delta: ${Math.round(memoryDelta / 1024 / 1024)}MB`);
      
      expect(streamedContent.length).toBeGreaterThan(1024 * 1024); // >1MB
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // Memory efficient streaming
      
      console.log('✅ Stream processing completed with memory efficiency');
    });
  });

  describe('Unicode and Special Character Handling', () => {
    test('REAL-WORLD: Handle Unicode and international content', async () => {
      console.log('🎯 REAL-WORLD: Testing Unicode and international content');
      
      const unicodeAgent = await createUnicodeAgent(testProjectPath);
      
      console.log(`📊 Created Unicode agent with ${unicodeAgent.languages.length} languages`);
      
      // Test diff with Unicode content
      const originalContent = await fs.readFile(unicodeAgent.filePath, 'utf-8');
      
      const templateWithUnicode = `# 国际化开发代理 (Internationalization Development Agent)

## Rôle (French)
Agent de développement avec support multilingue et caractères spéciaux.

## Роль (Russian)  
Агент разработки с поддержкой Unicode и специальных символов.

## 役割 (Japanese)
Unicode文字と特殊文字をサポートする開発エージェント。

## Instructions
- Support for Unicode characters: ñáéíóú àèìòù âêîôû ãõ çñ
- Mathematical symbols: ∀∃∅∈∉∋∌∩∪⊂⊃⊆⊇ ∑∏∫√∞
- Currency symbols: €¥£¢₹₽₩₪₫
- Special characters: ©®™°±×÷≠≤≥≈∴∵

\`\`\`python
# Unicode handling in code
class UnicodeProcessor:
    def __init__(self):
        self.patterns = {
            'chinese': r'[\u4e00-\u9fff]+',
            'japanese': r'[\u3040-\u309f\u30a0-\u30ff]+',
            'korean': r'[\uac00-\ud7af]+',
            'arabic': r'[\u0600-\u06ff]+',
            'hebrew': r'[\u0590-\u05ff]+',
            'cyrillic': r'[\u0400-\u04ff]+',
            'greek': r'[\u0370-\u03ff]+',
            'emoji': r'[\U0001f600-\U0001f64f\U0001f300-\U0001f5ff\U0001f680-\U0001f6ff\U0001f1e0-\U0001f1ff]+'
        }
    
    def detect_language(self, text):
        """Detect language from Unicode patterns"""
        for lang, pattern in self.patterns.items():
            if re.search(pattern, text):
                return lang
        return 'unknown'
    
    def normalize_text(self, text):
        """Normalize Unicode text"""
        import unicodedata
        return unicodedata.normalize('NFC', text)
\`\`\`

<!-- USER_UNICODE_CONTENT -->
${unicodeAgent.customContent}
<!-- END_USER_UNICODE_CONTENT -->

## Emoji Support 🚀
Test emoji handling: 🔥💻🌟⚡🎯🛡️🌍📊✅❌⚠️🔍

### Symbols and Special Characters
Testing various Unicode ranges:
- Mathematical: ∑(x²+y²) = ∫∫ f(x,y) dxdy
- Scientific: H₂O + CO₂ → C₆H₁₂O₆ + O₂
- Currency: Product costs €50.99, ¥5,000, or $45.50
- Fractions: ½ + ¼ = ¾
`;

      const diffResult = await diffEngine.analyzeAgentChanges(
        'unicode-agent',
        originalContent,
        templateWithUnicode
      );

      expect(diffResult.success).toBe(true);
      
      // Verify Unicode content is preserved correctly
      const userContent = diffResult.userSections.map(s => s.content).join('\n');
      
      // Check for preserved Unicode characters
      expect(userContent).toContain('中文测试内容'); // Chinese
      expect(userContent).toContain('日本語のテスト'); // Japanese
      expect(userContent).toContain('한국어 테스트'); // Korean
      expect(userContent).toContain('العربية اختبار'); // Arabic
      expect(userContent).toContain('עברית מבחן'); // Hebrew
      expect(userContent).toContain('русский тест'); // Russian
      expect(userContent).toContain('ελληνική δοκιμή'); // Greek
      
      console.log('✅ Unicode content preserved correctly');
      
      // Test merge with Unicode
      const mergeResult = await mergeEngine.executeMerge(
        unicodeAgent.filePath,
        diffResult,
        { 'default': 'smart-merge' },
        { dryRun: false }
      );

      expect(mergeResult.success).toBe(true);
      
      // Verify merged content maintains Unicode integrity
      const mergedContent = await fs.readFile(unicodeAgent.filePath, 'utf-8');
      
      // Validate Unicode normalization
      const isNormalizedNFC = mergedContent === mergedContent.normalize('NFC');
      expect(isNormalizedNFC).toBe(true);
      
      console.log('✅ Unicode merge completed with character integrity');
    });

    test('REAL-WORLD: Handle special formatting and markup', async () => {
      console.log('🎯 REAL-WORLD: Testing special formatting preservation');
      
      const formattedAgent = await createFormattedAgent(testProjectPath);
      
      // Test complex markdown and formatting preservation
      const originalContent = await fs.readFile(formattedAgent.filePath, 'utf-8');
      
      const templateWithFormatting = originalContent.replace(
        '# Formatted Content Agent',
        '# Enhanced Formatted Content Agent'
      ) + `

## New Template Formatting

### Tables with Special Characters
| Symbol | Unicode | Description | Example |
|--------|---------|-------------|---------|
| ∀ | U+2200 | For all | ∀x ∈ ℝ |
| ∃ | U+2203 | There exists | ∃y: y > x |
| ∅ | U+2205 | Empty set | A ∩ B = ∅ |
| ∞ | U+221E | Infinity | lim(x→∞) |

### Code with Special Characters
\`\`\`bash
# Special characters in shell commands
grep -E "[àáâãäåæçèéêë]" file.txt
sed 's/[''""]/"/g' input.txt > output.txt
awk '/[αβγδε]/ { print $0 }' greek.txt
\`\`\`

### Links and References
- [Unicode Standard](https://unicode.org/standard/standard.html)
- [RFC 3629 - UTF-8](https://tools.ietf.org/html/rfc3629)
- [Mathematical Operators](https://unicode.org/charts/PDF/U2200.pdf)

> **Note**: Special characters require proper encoding and handling.
> Use UTF-8 encoding throughout the application.

### Nested Lists with Special Formatting
1. **Primary Level** (with **bold** and *italic*)
   - Secondary level with `inline code`
   - Another item with [link](https://example.com) and footnote¹
     - Tertiary level with ~~strikethrough~~
     - And ==highlighted== text
2. **Another Primary** 
   - With mathematical expressions: E = mc²
   - And chemical formulas: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O

¹ Footnote with special characters: This is a test footnote.
`;

      const diffResult = await diffEngine.analyzeAgentChanges(
        'formatted-agent',
        originalContent,
        templateWithFormatting
      );

      expect(diffResult.success).toBe(true);
      
      // Verify complex formatting is preserved
      const preservedContent = diffResult.userSections.map(s => s.content).join('\n');
      
      // Check for preserved formatting elements
      expect(preservedContent).toContain('| Header 1 | Header 2 |');
      expect(preservedContent).toContain('```javascript');
      expect(preservedContent).toContain('**bold text**');
      expect(preservedContent).toContain('*italic text*');
      expect(preservedContent).toContain('> Blockquote');
      expect(preservedContent).toContain('[Link Text](');
      
      console.log('✅ Complex formatting preserved correctly');
      
      // Test that new template formatting is added correctly
      const templateContent = diffResult.templateSections.map(s => s.content).join('\n');
      expect(templateContent).toContain('| Symbol | Unicode |');
      expect(templateContent).toContain('E = mc²');
      
      console.log('✅ New template formatting integrated successfully');
    });
  });

  describe('Performance and Memory Testing', () => {
    test('REAL-WORLD: Benchmark processing performance with realistic data', async () => {
      console.log('🎯 REAL-WORLD: Performance benchmarking with realistic data');
      
      // Create multiple agents with varying complexity
      const testAgents = await Promise.all([
        createSimpleAgent(testProjectPath, 'simple-1'),
        createMediumComplexityAgent(testProjectPath, 'medium-1'),
        createComplexBusinessAgent(testProjectPath, 'complex-1'),
        createLargeDocumentationAgent(testProjectPath, 'large-1'),
        createUnicodeAgent(testProjectPath, 'unicode-1')
      ]);
      
      console.log(`📊 Created ${testAgents.length} test agents for benchmarking`);
      
      const benchmarkResults = [];
      
      for (const agent of testAgents) {
        console.log(`🔍 Benchmarking: ${agent.name}`);
        
        const startTime = process.hrtime.bigint();
        const initialMemory = process.memoryUsage();
        
        // Simulate realistic template update
        const originalContent = await fs.readFile(agent.filePath, 'utf-8');
        const templateUpdate = originalContent + '\n\n## Template Update\nNew content added.';
        
        const diffResult = await diffEngine.analyzeAgentChanges(
          agent.name,
          originalContent,
          templateUpdate
        );

        const endTime = process.hrtime.bigint();
        const finalMemory = process.memoryUsage();
        
        const processingTimeNs = endTime - startTime;
        const processingTimeMs = Number(processingTimeNs / 1000000n);
        const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
        
        const result = {
          name: agent.name,
          complexity: agent.complexity,
          fileSizeKB: agent.stats.sizeKB,
          processingTimeMs,
          memoryDeltaMB: Math.round(memoryDelta / 1024 / 1024),
          throughputKBperSec: Math.round(agent.stats.sizeKB / (processingTimeMs / 1000))
        };
        
        benchmarkResults.push(result);
        
        console.log(`   Processing time: ${processingTimeMs}ms`);
        console.log(`   Memory delta: ${result.memoryDeltaMB}MB`);
        console.log(`   Throughput: ${result.throughputKBperSec} KB/s`);
      }
      
      // Analyze benchmark results
      const avgProcessingTime = benchmarkResults.reduce((sum, r) => sum + r.processingTimeMs, 0) / benchmarkResults.length;
      const avgThroughput = benchmarkResults.reduce((sum, r) => sum + r.throughputKBperSec, 0) / benchmarkResults.length;
      const maxMemoryUsage = Math.max(...benchmarkResults.map(r => r.memoryDeltaMB));
      
      console.log('📊 BENCHMARK RESULTS:');
      console.log(`   Average processing time: ${Math.round(avgProcessingTime)}ms`);
      console.log(`   Average throughput: ${Math.round(avgThroughput)} KB/s`);
      console.log(`   Maximum memory usage: ${maxMemoryUsage}MB`);
      
      // Performance assertions
      expect(avgProcessingTime).toBeLessThan(1000); // Should average under 1 second
      expect(avgThroughput).toBeGreaterThan(100); // Should process at least 100KB/s
      expect(maxMemoryUsage).toBeLessThan(50); // Should use less than 50MB peak memory
      
      console.log('✅ Performance benchmarks passed');
    });
  });
});

// Helper functions for creating realistic test data

async function createTempDir(prefix) {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

async function createComplexBusinessAgent(projectPath, name = 'complex-business-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const customContent = `## Custom Business Logic

### Proprietary Workflow Engine
\`\`\`javascript
class ProprietaryWorkflowEngine {
  constructor() {
    this.apiKey = process.env.PROPRIETARY_API_KEY;
    this.endpoint = 'https://internal-systems.company.com/api/v2';
    this.workflows = new Map();
    this.executionHistory = [];
  }
  
  async executeCustomWorkflow(workflowId, data) {
    // Critical business logic - DO NOT MODIFY
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(\`Workflow \${workflowId} not found\`);
    }
    
    const executionContext = {
      id: this.generateExecutionId(),
      workflowId,
      startTime: new Date(),
      data: this.sanitizeInputData(data),
      status: 'running'
    };
    
    try {
      const result = await this.processWorkflowSteps(workflow, executionContext);
      
      executionContext.status = 'completed';
      executionContext.result = result;
      executionContext.endTime = new Date();
      
      this.executionHistory.push(executionContext);
      
      // Send to proprietary monitoring system
      await this.reportExecution(executionContext);
      
      return result;
    } catch (error) {
      executionContext.status = 'failed';
      executionContext.error = error.message;
      executionContext.endTime = new Date();
      
      this.executionHistory.push(executionContext);
      throw error;
    }
  }
  
  async processWorkflowSteps(workflow, context) {
    const results = [];
    
    for (const step of workflow.steps) {
      const stepResult = await this.executeStep(step, context.data, results);
      results.push(stepResult);
      
      // Update context data for next step
      context.data = { ...context.data, ...stepResult.outputData };
    }
    
    return this.compileResults(results);
  }
  
  async executeStep(step, inputData, previousResults) {
    switch (step.type) {
      case 'data_validation':
        return await this.validateBusinessData(inputData, step.rules);
      case 'external_api_call':
        return await this.callExternalSystem(step.config, inputData);
      case 'business_rule_application':
        return await this.applyBusinessRules(step.rules, inputData);
      case 'compliance_check':
        return await this.performComplianceValidation(inputData, step.requirements);
      default:
        throw new Error(\`Unknown step type: \${step.type}\`);
    }
  }
}
\`\`\`

### Customer Data Processing
\`\`\`python
class CustomerDataProcessor:
    def __init__(self):
        self.encryption_key = os.getenv('CUSTOMER_DATA_KEY')
        self.compliance_rules = self.load_compliance_rules()
        self.data_retention_policies = self.load_retention_policies()
    
    async def process_customer_request(self, customer_id, request_type, data):
        """
        Process customer data requests with full compliance.
        This method handles PII according to GDPR, CCPA, and company policies.
        """
        # Validate customer identity
        customer = await self.validate_customer(customer_id)
        if not customer:
            raise ValueError("Invalid customer ID")
        
        # Check request permissions
        if not self.check_request_permissions(customer, request_type):
            raise PermissionError("Customer not authorized for this request type")
        
        # Process based on request type
        if request_type == 'data_export':
            return await self.export_customer_data(customer, data.get('format', 'json'))
        elif request_type == 'data_deletion':
            return await self.delete_customer_data(customer, data.get('scope', 'all'))
        elif request_type == 'data_correction':
            return await self.correct_customer_data(customer, data)
        elif request_type == 'consent_update':
            return await self.update_consent_preferences(customer, data)
        else:
            raise ValueError(f"Unknown request type: {request_type}")
    
    async def export_customer_data(self, customer, format='json'):
        """Export all customer data in requested format"""
        # Collect data from all systems
        data_sources = [
            'customer_profiles',
            'transaction_history', 
            'interaction_logs',
            'preference_settings',
            'communication_history'
        ]
        
        customer_data = {}
        for source in data_sources:
            source_data = await self.collect_from_source(source, customer.id)
            customer_data[source] = self.anonymize_sensitive_fields(source_data)
        
        # Format according to request
        if format == 'json':
            return json.dumps(customer_data, indent=2)
        elif format == 'csv':
            return self.convert_to_csv(customer_data)
        elif format == 'xml':
            return self.convert_to_xml(customer_data)
        else:
            raise ValueError(f"Unsupported format: {format}")
\`\`\`

### Integration Configuration
\`\`\`yaml
# Custom integration settings - DO NOT MODIFY
proprietary_systems:
  crm_integration:
    endpoint: "https://crm.company.com/api/v3"
    auth_method: "oauth2"
    client_id: "\${CRM_CLIENT_ID}"
    scopes: ["read:customers", "write:interactions", "admin:reports"]
    
  payment_processor:
    provider: "proprietary_payment_gateway"
    endpoint: "https://payments.company.com/process"
    webhook_url: "https://our-system.com/webhooks/payment"
    supported_currencies: ["USD", "EUR", "GBP", "JPY", "CAD"]
    
  notification_system:
    channels:
      - type: "email"
        provider: "internal_smtp"
        templates_path: "/opt/email-templates"
      - type: "sms"
        provider: "twilio"
        account_sid: "\${TWILIO_SID}"
      - type: "push"
        provider: "firebase"
        project_id: "\${FIREBASE_PROJECT}"

business_rules:
  customer_segmentation:
    high_value_threshold: 10000
    loyalty_tiers: ["bronze", "silver", "gold", "platinum"]
    automatic_upgrades: true
    
  compliance_requirements:
    data_retention_days: 2555  # 7 years
    audit_log_retention_days: 3650  # 10 years
    pii_encryption_required: true
    gdpr_consent_tracking: true
\`\`\`

### Custom Monitoring and Analytics
\`\`\`javascript
class ProprietaryAnalytics {
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.anomalyDetector = new AnomalyDetector();
    this.reportGenerator = new ReportGenerator();
  }
  
  async trackBusinessMetric(metricName, value, tags = {}) {
    const metric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION
      }
    };
    
    await this.metricsCollector.send(metric);
    
    // Check for anomalies
    const isAnomalous = await this.anomalyDetector.analyze(metric);
    if (isAnomalous) {
      await this.alertSystem.sendAlert({
        type: 'anomaly_detected',
        metric: metricName,
        value,
        timestamp: metric.timestamp
      });
    }
  }
  
  async generateBusinessReport(reportType, parameters) {
    // Generate comprehensive business reports
    const reportConfig = this.getReportConfiguration(reportType);
    const data = await this.collectReportData(reportConfig, parameters);
    
    return await this.reportGenerator.generate(reportConfig, data);
  }
}
\`\`\``;
  
  const content = `# Complex Business Agent

## Role
Advanced business process automation agent with proprietary workflows and integrations.

## Core Instructions
- Execute proprietary business workflows
- Maintain compliance with company policies
- Process customer data according to regulations
- Integrate with internal systems securely

<!-- USER_CUSTOMIZATION_START -->
${customContent}
<!-- USER_CUSTOMIZATION_END -->

## Standard Agent Capabilities
- File processing and analysis
- API integration management
- Data validation and transformation
- Error handling and logging
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  
  return {
    name,
    filePath,
    customContent,
    complexity: 'high',
    stats: {
      sizeKB: Math.round(stats.size / 1024),
      totalLines: content.split('\n').length,
      codeBlocks: codeBlockCount
    }
  };
}

async function createMultiLanguageAgent(projectPath, name = 'multi-language-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const languages = ['javascript', 'python', 'java', 'go', 'rust', 'sql', 'bash', 'yaml', 'json'];
  
  const customContent = `## Multi-Language Code Handling

### JavaScript/Node.js
\`\`\`javascript
const express = require('express');
const { promisify } = require('util');

class MultiLanguageProcessor {
  constructor() {
    this.supportedLanguages = new Set(['js', 'py', 'java', 'go', 'rs']);
    this.processors = new Map();
  }
  
  async processCode(language, code) {
    const processor = this.processors.get(language);
    if (!processor) {
      throw new Error(\`Unsupported language: \${language}\`);
    }
    
    return await processor.execute(code);
  }
}
\`\`\`

### Python Integration
\`\`\`python
import asyncio
import subprocess
from typing import Dict, Any, Optional

class PythonCodeExecutor:
    def __init__(self):
        self.virtual_env = os.getenv('PYTHON_VENV_PATH')
        self.allowed_imports = [
            'os', 'sys', 'json', 'datetime', 'math', 'random',
            'requests', 'pandas', 'numpy', 'asyncio'
        ]
    
    async def execute_python_code(self, code: str, timeout: int = 30) -> Dict[str, Any]:
        # Validate imports
        imports = self.extract_imports(code)
        forbidden = set(imports) - set(self.allowed_imports)
        if forbidden:
            raise ValueError(f"Forbidden imports: {forbidden}")
        
        # Execute in sandboxed environment
        process = await asyncio.create_subprocess_exec(
            f"{self.virtual_env}/bin/python", "-c", code,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )
            
            return {
                'returncode': process.returncode,
                'stdout': stdout.decode('utf-8'),
                'stderr': stderr.decode('utf-8')
            }
        except asyncio.TimeoutError:
            process.kill()
            raise TimeoutError(f"Code execution timed out after {timeout}s")
\`\`\`

### Java Processing
\`\`\`java
import java.util.concurrent.*;
import java.nio.file.*;
import javax.tools.*;

public class JavaCodeProcessor {
    private final ExecutorService executor;
    private final JavaCompiler compiler;
    private final Path tempDir;
    
    public JavaCodeProcessor() {
        this.executor = Executors.newFixedThreadPool(4);
        this.compiler = ToolProvider.getSystemJavaCompiler();
        this.tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
    }
    
    public CompletableFuture<ExecutionResult> executeJavaCode(String code) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Create temporary file
                Path javaFile = tempDir.resolve("TempClass.java");
                Files.write(javaFile, code.getBytes());
                
                // Compile
                int compilationResult = compiler.run(null, null, null, 
                    javaFile.toString());
                
                if (compilationResult != 0) {
                    return new ExecutionResult(false, "Compilation failed");
                }
                
                // Execute
                ProcessBuilder pb = new ProcessBuilder(
                    "java", "-cp", tempDir.toString(), "TempClass"
                );
                Process process = pb.start();
                
                boolean finished = process.waitFor(30, TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    return new ExecutionResult(false, "Execution timeout");
                }
                
                String output = new String(process.getInputStream().readAllBytes());
                return new ExecutionResult(true, output);
                
            } catch (Exception e) {
                return new ExecutionResult(false, e.getMessage());
            }
        }, executor);
    }
}
\`\`\`

### Go Language Support
\`\`\`go
package main

import (
    "context"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "time"
)

type GoCodeProcessor struct {
    tempDir   string
    timeout   time.Duration
    goPath    string
}

func NewGoCodeProcessor() *GoCodeProcessor {
    return &GoCodeProcessor{
        tempDir: os.TempDir(),
        timeout: 30 * time.Second,
        goPath:  "/usr/local/go/bin/go",
    }
}

func (g *GoCodeProcessor) ExecuteGoCode(code string) (*ExecutionResult, error) {
    // Create temporary Go file
    tempFile := filepath.Join(g.tempDir, fmt.Sprintf("temp_%d.go", time.Now().Unix()))
    
    err := os.WriteFile(tempFile, []byte(code), 0644)
    if err != nil {
        return nil, fmt.Errorf("failed to write temp file: %w", err)
    }
    defer os.Remove(tempFile)
    
    // Create context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), g.timeout)
    defer cancel()
    
    // Execute Go code
    cmd := exec.CommandContext(ctx, g.goPath, "run", tempFile)
    output, err := cmd.CombinedOutput()
    
    if ctx.Err() == context.DeadlineExceeded {
        return &ExecutionResult{
            Success: false,
            Output:  "Execution timed out",
        }, nil
    }
    
    return &ExecutionResult{
        Success: err == nil,
        Output:  string(output),
        Error:   err,
    }, nil
}
\`\`\`

### SQL Query Processing
\`\`\`sql
-- Complex query handling with safety checks
WITH RECURSIVE data_hierarchy AS (
  SELECT 
    id,
    parent_id,
    name,
    level,
    CAST(id AS VARCHAR(1000)) as path
  FROM categories 
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT 
    c.id,
    c.parent_id,
    c.name,
    dh.level + 1,
    CONCAT(dh.path, '->', c.id)
  FROM categories c
  INNER JOIN data_hierarchy dh ON c.parent_id = dh.id
  WHERE dh.level < 10  -- Prevent infinite recursion
),
performance_stats AS (
  SELECT 
    category_id,
    COUNT(*) as item_count,
    AVG(price) as avg_price,
    SUM(revenue) as total_revenue,
    STDDEV(price) as price_std_dev
  FROM products 
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY category_id
)
SELECT 
  dh.name,
  dh.level,
  dh.path,
  COALESCE(ps.item_count, 0) as items,
  COALESCE(ps.avg_price, 0) as avg_price,
  COALESCE(ps.total_revenue, 0) as revenue
FROM data_hierarchy dh
LEFT JOIN performance_stats ps ON dh.id = ps.category_id
ORDER BY dh.level, dh.name;
\`\`\`

### Bash Script Execution
\`\`\`bash
#!/bin/bash

# Safe bash script execution with validation
set -euo pipefail  # Exit on error, undefined vars, pipe failures

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="${SCRIPT_DIR}/execution.log"
readonly MAX_EXECUTION_TIME=300  # 5 minutes

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Timeout wrapper function
execute_with_timeout() {
    local timeout=$1
    shift
    local command="$@"
    
    log "Executing: $command"
    
    if timeout "$timeout" bash -c "$command"; then
        log "Command completed successfully"
        return 0
    else
        local exit_code=$?
        log "Command failed with exit code: $exit_code"
        return $exit_code
    fi
}

# Input validation
validate_input() {
    local input="$1"
    
    # Check for dangerous patterns
    if [[ "$input" =~ (rm\s+-rf|sudo|su\s|chmod\s+777|>\s*/dev) ]]; then
        log "ERROR: Dangerous command pattern detected"
        return 1
    fi
    
    # Check for path traversal
    if [[ "$input" =~ \.\./|\.\.\\ ]]; then
        log "ERROR: Path traversal detected"
        return 1
    fi
    
    return 0
}

# Main execution function
main() {
    local script_content="$1"
    
    if ! validate_input "$script_content"; then
        log "Input validation failed"
        exit 1
    fi
    
    # Execute with timeout
    execute_with_timeout "$MAX_EXECUTION_TIME" "$script_content"
}

# Call main with all arguments
main "$@"
\`\`\``;
  
  const content = `# Multi-Language Development Agent

## Role
Development agent with comprehensive multi-language code processing capabilities.

## Instructions
- Support execution and analysis of multiple programming languages
- Provide safe sandboxed execution environments
- Handle language-specific dependencies and requirements
- Implement proper error handling and timeouts

<!-- USER_CUSTOMIZATION_START -->
${customContent}
<!-- USER_CUSTOMIZATION_END -->

## Supported Languages
Current language support includes: ${languages.join(', ')}

## Security Guidelines
- All code execution must be sandboxed
- Input validation is required for all languages
- Timeout limits must be enforced
- Resource usage should be monitored
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    customContent,
    languages,
    complexity: 'high',
    stats: {
      sizeKB: Math.round(stats.size / 1024),
      totalLines: content.split('\n').length,
      codeBlocks: (content.match(/```/g) || []).length / 2
    }
  };
}

// Additional helper functions for creating test agents...

async function createLargeDocumentationAgent(projectPath, name = 'large-documentation-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  // Generate large documentation content
  const sections = ['# Comprehensive Documentation Agent'];
  
  for (let i = 1; i <= 100; i++) {
    sections.push(`## Section ${i}: Advanced Topic ${i}`);
    sections.push('');
    sections.push(`This section covers advanced topic ${i} with comprehensive details and examples.`);
    sections.push('');
    
    // Add subsections
    for (let j = 1; j <= 5; j++) {
      sections.push(`### Subsection ${i}.${j}`);
      sections.push('');
      sections.push(`Detailed explanation of subtopic ${i}.${j} with implementation examples.`);
      sections.push('');
      
      // Add code example
      sections.push('```javascript');
      sections.push(`// Example code for section ${i}.${j}`);
      sections.push(`class Example${i}_${j} {`);
      sections.push(`  constructor() {`);
      sections.push(`    this.sectionId = '${i}.${j}';`);
      sections.push(`    this.data = [];`);
      sections.push(`  }`);
      sections.push('');
      sections.push(`  processData(input) {`);
      sections.push(`    // Processing logic for section ${i}.${j}`);
      sections.push(`    return input.map(item => ({`);
      sections.push(`      ...item,`);
      sections.push(`      processedBy: this.sectionId,`);
      sections.push(`      timestamp: new Date().toISOString()`);
      sections.push(`    }));`);
      sections.push(`  }`);
      sections.push(`}`);
      sections.push('```');
      sections.push('');
    }
    
    // Add reference table
    sections.push(`### Reference Table for Section ${i}`);
    sections.push('');
    sections.push('| Parameter | Type | Description | Example |');
    sections.push('|-----------|------|-------------|---------|');
    for (let k = 1; k <= 10; k++) {
      sections.push(`| param${k} | string | Parameter ${k} description | "example${k}" |`);
    }
    sections.push('');
  }
  
  const content = sections.join('\n');
  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    complexity: 'high',
    stats: {
      sizeKB: Math.round(stats.size / 1024),
      sections: 100,
      totalLines: content.split('\n').length
    }
  };
}

async function createUnicodeAgent(projectPath, name = 'unicode-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const customContent = `## International Content Processing

### Multi-Language Support
This agent handles content in multiple languages and character sets:

#### Chinese (中文)
\`\`\`javascript
// 中文测试内容
class ChineseProcessor {
  constructor() {
    this.语言 = '中文';
    this.字符集 = 'UTF-8';
  }
  
  处理文本(输入) {
    // 处理中文文本的逻辑
    return 输入.replace(/[，。！？；：]/g, match => {
      return this.标准化标点(match);
    });
  }
}
\`\`\`

#### Japanese (日本語)
\`\`\`python
# 日本語のテスト
def process_japanese_text(テキスト):
    """日本語テキストを処理する関数"""
    import re
    
    # ひらがな、カタカナ、漢字の処理
    hiragana_pattern = r'[ひらがな]+'
    katakana_pattern = r'[カタカナ]+'
    kanji_pattern = r'[漢字]+'
    
    return {
        'original': テキスト,
        'hiragana_count': len(re.findall(hiragana_pattern, テキスト)),
        'katakana_count': len(re.findall(katakana_pattern, テキスト)),
        'kanji_count': len(re.findall(kanji_pattern, テキスト))
    }
\`\`\`

#### Korean (한국어)
\`\`\`go
// 한국어 테스트
package main

import (
    "fmt"
    "unicode"
    "unicode/utf8"
)

type KoreanProcessor struct {
    언어 string
    문자집합 string
}

func (kp *KoreanProcessor) 텍스트처리(입력 string) map[string]interface{} {
    var 한글개수 int
    var 영어개수 int
    var 숫자개수 int
    
    for _, 문자 := range 입력 {
        if unicode.Is(unicode.Hangul, 문자) {
            한글개수++
        } else if unicode.IsLetter(문자) {
            영어개수++
        } else if unicode.IsDigit(문자) {
            숫자개수++
        }
    }
    
    return map[string]interface{}{
        "한글": 한글개수,
        "영어": 영어개수,
        "숫자": 숫자개수,
        "총길이": utf8.RuneCountInString(입력),
    }
}
\`\`\`

#### Arabic (العربية)
\`\`\`java
// العربية اختبار
public class ArabicProcessor {
    private String اللغة = "العربية";
    private String الترميز = "UTF-8";
    
    public ProcessingResult معالجةالنص(String النص) {
        // معالجة النص العربي
        boolean يحتويعلىالعربية = النص.matches(".*[\\u0600-\\u06FF]+.*");
        boolean الاتجاهمنالشرق = true; // النص العربي من اليمين إلى اليسار
        
        return new ProcessingResult()
            .setContainsArabic(يحتويعلىالعربية)
            .setRightToLeft(الاتجاهمنالشرق)
            .setOriginalText(النص);
    }
}
\`\`\`

#### Hebrew (עברית)
\`\`\`python
# עברית מבחן
class HebrewProcessor:
    def __init__(self):
        self.שפה = "עברית"
        self.קידוד = "UTF-8"
    
    def עיבודטקסט(self, טקסט):
        """עיבוד טקסט בעברית"""
        import re
        
        hebrew_pattern = r'[א-ת]+'
        matches = re.findall(hebrew_pattern, טקסט)
        
        return {
            'מקורי': טקסט,
            'מכילעברית': len(matches) > 0,
            'מספרמילים': len(matches),
            'כיווןקריאה': 'ימין_לשמאל'
        }
\`\`\`

#### Russian (русский)
\`\`\`javascript
// русский тест
class RussianProcessor {
    constructor() {
        this.язык = 'русский';
        this.кодировка = 'UTF-8';
    }
    
    обработатьТекст(текст) {
        // Обработка русского текста
        const кириллица = /[а-яё]/gi;
        const совпадения = текст.match(кириллица) || [];
        
        return {
            исходный: текст,
            содержитКириллицу: совпадения.length > 0,
            количествоСимволов: совпадения.length,
            направлениеЧтения: 'слева_направо'
        };
    }
}
\`\`\`

#### Greek (ελληνικά)
\`\`\`sql
-- ελληνική δοκιμή
CREATE TABLE ελληνικά_δεδομένα (
    αναγνωριστικό INT PRIMARY KEY,
    όνομα NVARCHAR(100),
    περιγραφή NVARCHAR(500),
    ημερομηνία_δημιουργίας DATETIME,
    κατάσταση NVARCHAR(50)
);

INSERT INTO ελληνικά_δεδομένα 
(αναγνωριστικό, όνομα, περιγραφή, ημερομηνία_δημιουργίας, κατάσταση)
VALUES 
(1, 'Πρώτο στοιχείο', 'Περιγραφή του πρώτου στοιχείου', GETDATE(), 'ενεργό'),
(2, 'Δεύτερο στοιχείο', 'Περιγραφή του δεύτερου στοιχείου', GETDATE(), 'ανενεργό');
\`\`\``;
  
  const languages = ['Chinese', 'Japanese', 'Korean', 'Arabic', 'Hebrew', 'Russian', 'Greek'];
  
  const content = `# Unicode and International Content Agent

## Role
Specialized agent for handling Unicode content and international text processing.

## Instructions
- Process content in multiple languages and character sets
- Handle right-to-left and left-to-right text directions
- Preserve Unicode normalization and encoding
- Support complex script processing

<!-- USER_CUSTOMIZATION_START -->
${customContent}
<!-- USER_CUSTOMIZATION_END -->

## Character Set Support
This agent supports the following Unicode ranges:
- Latin Extended: U+0100-U+017F
- Greek and Coptic: U+0370-U+03FF
- Cyrillic: U+0400-U+04FF
- Hebrew: U+0590-U+05FF
- Arabic: U+0600-U+06FF
- CJK Unified Ideographs: U+4E00-U+9FFF

## Testing Emojis and Symbols
🚀🔥💻🌟⚡🎯🛡️🌍📊✅❌⚠️🔍
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    customContent,
    languages,
    complexity: 'medium',
    stats: {
      sizeKB: Math.round(stats.size / 1024),
      totalLines: content.split('\n').length
    }
  };
}

// Additional helper functions can be added for other test agent types...

async function createSimpleAgent(projectPath, name) {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const content = `# ${name}

## Role
Simple agent for basic operations.

## Instructions
- Handle simple tasks
- Provide basic functionality
- Maintain minimal complexity
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    complexity: 'low',
    stats: {
      sizeKB: Math.round(stats.size / 1024)
    }
  };
}

async function createMediumComplexityAgent(projectPath, name) {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const content = `# ${name}

## Role
Medium complexity agent with moderate functionality.

## Instructions
- Handle moderate complexity tasks
- Provide structured functionality
- Balance simplicity with capability

\`\`\`javascript
class MediumAgent {
  constructor() {
    this.capabilities = ['processing', 'analysis', 'reporting'];
  }
  
  async processTask(task) {
    // Medium complexity processing
    return await this.analyzeAndProcess(task);
  }
}
\`\`\`

## Configuration
- Processing timeout: 30 seconds
- Max concurrent tasks: 5
- Memory limit: 256MB
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    complexity: 'medium',
    stats: {
      sizeKB: Math.round(stats.size / 1024)
    }
  };
}

async function createFormattedAgent(projectPath, name = 'formatted-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const content = `# Formatted Content Agent

## Role
Agent specialized in handling complex markdown formatting and special characters.

## Instructions
- Process **bold** and *italic* text correctly
- Handle \`inline code\` and code blocks
- Preserve links and references
- Maintain table formatting

### Complex Table Example
| Header 1 | Header 2 | Header 3 | Special Chars |
|----------|----------|----------|---------------|
| Data 1   | Data 2   | Data 3   | àáâãäå        |
| Info A   | Info B   | Info C   | çñüß          |
| Test X   | Test Y   | Test Z   | øæœ           |

### Links and References
- [Internal Link](#section)
- [External Link](https://example.com)
- [Reference Link][ref1]

[ref1]: https://reference.example.com

### Code Blocks with Languages
\`\`\`javascript
function complexFormatting() {
  const special = "àáâãäåæçèéêëìíîïñòóôõöùúûüý";
  return special.normalize('NFC');
}
\`\`\`

\`\`\`python
def handle_unicode():
    special = "àáâãäåæçèéêëìíîïñòóôõöùúûüý"
    return unicodedata.normalize('NFC', special)
\`\`\`

### Nested Lists
1. **Primary Level**
   - Secondary level with \`inline code\`
   - Another item with *emphasis*
     - Tertiary level
     - Another tertiary item
2. **Another Primary**
   - With [link](https://example.com)
   - And more content

### Blockquotes
> This is a blockquote with **bold** text.
> 
> And multiple paragraphs with *italic* content.

### Special Characters Test
- Accented: àáâãäåæçèéêëìíîïñòóôõöùúûüý
- Mathematical: ∀∃∅∈∉∋∌∩∪⊂⊃⊆⊇ ∑∏∫√∞
- Currency: €¥£¢₹₽₩₪₫
- Arrows: ←→↑↓↔↕↖↗↘↙
`;

  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    complexity: 'medium',
    stats: {
      sizeKB: Math.round(stats.size / 1024)
    }
  };
}

async function createExtraLargeAgent(projectPath, name = 'extra-large-agent') {
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  // Generate very large content (>5MB)
  const sections = ['# Extra Large Agent for Stream Testing'];
  
  // Create massive content
  for (let i = 1; i <= 500; i++) {
    sections.push(`## Massive Section ${i}`);
    sections.push('');
    
    // Add large blocks of text
    const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
    sections.push(paragraph);
    sections.push('');
    
    // Add code block
    sections.push('```javascript');
    for (let j = 1; j <= 50; j++) {
      sections.push(`// Line ${j} in section ${i}`);
      sections.push(`const variable${j} = "value_${i}_${j}";`);
    }
    sections.push('```');
    sections.push('');
  }
  
  const content = sections.join('\n');
  const filePath = path.join(agentsDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  
  const stats = await fs.stat(filePath);
  
  return {
    name,
    filePath,
    complexity: 'extreme',
    stats: {
      sizeKB: Math.round(stats.size / 1024)
    }
  };
}