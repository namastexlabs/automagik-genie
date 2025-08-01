const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * TEST DATA GENERATOR: Realistic Test Fixtures and Data
 * 
 * Generates comprehensive test data for update system testing:
 * - Realistic agent files with business logic
 * - Complex hook configurations
 * - Registry files in various states
 * - Template files with version variations
 * - Backup directories with different structures
 * - Performance test datasets
 */

class TestDataGenerator {
  constructor() {
    this.baseDir = null;
    this.projectStructures = new Map();
    this.generatedFiles = [];
  }

  /**
   * Initialize test data generator with base directory
   * @param {string} baseDir - Base directory for test data
   */
  async initialize(baseDir) {
    this.baseDir = baseDir || path.join(os.tmpdir(), `test-data-${Date.now()}`);
    await fs.mkdir(this.baseDir, { recursive: true });
    
    console.log(`📁 Initialized test data generator: ${this.baseDir}`);
    return this.baseDir;
  }

  /**
   * Generate complete project structure with realistic data
   * @param {Object} options - Generation options
   */
  async generateProject(options = {}) {
    const {
      name = 'test-project',
      agentCount = 10,
      hookCount = 5,
      hasCustomizations = true,
      complexity = 'medium',
      includeBackups = true,
      includeRegistry = true,
      includeLegacy = false
    } = options;

    console.log(`🏗️ Generating project: ${name} (${complexity} complexity)`);

    const projectPath = path.join(this.baseDir, name);
    await fs.mkdir(projectPath, { recursive: true });

    const projectData = {
      name,
      path: projectPath,
      agents: [],
      hooks: [],
      registry: null,
      backups: [],
      metadata: {
        created: new Date().toISOString(),
        complexity,
        agentCount,
        hookCount
      }
    };

    // Generate agents
    console.log(`📝 Generating ${agentCount} agents...`);
    for (let i = 0; i < agentCount; i++) {
      const agent = await this.generateAgent(projectPath, {
        index: i,
        hasCustomizations: hasCustomizations && (i % 3 === 0),
        complexity: this.getVariedComplexity(complexity, i),
        includeLegacy: includeLegacy && (i % 5 === 0)
      });
      projectData.agents.push(agent);
    }

    // Generate hooks
    console.log(`🪝 Generating ${hookCount} hooks...`);
    for (let i = 0; i < hookCount; i++) {
      const hook = await this.generateHook(projectPath, {
        index: i,
        hasCustomizations: hasCustomizations && (i % 2 === 0),
        complexity: this.getVariedComplexity(complexity, i)
      });
      projectData.hooks.push(hook);
    }

    // Generate registry files
    if (includeRegistry) {
      console.log('📊 Generating registry files...');
      projectData.registry = await this.generateRegistry(projectPath, projectData);
    }

    // Generate backups
    if (includeBackups) {
      console.log('💾 Generating backup structures...');
      projectData.backups = await this.generateBackups(projectPath, projectData);
    }

    // Generate project metadata
    await this.generateProjectMetadata(projectPath, projectData);

    this.projectStructures.set(name, projectData);
    console.log(`✅ Project generated: ${name}`);
    
    return projectData;
  }

  /**
   * Generate realistic agent file with business logic
   */
  async generateAgent(projectPath, options = {}) {
    const {
      index = 0,
      hasCustomizations = false,
      complexity = 'medium',
      includeLegacy = false
    } = options;

    const agentName = `genie-${this.getAgentType(index)}-${index.toString().padStart(3, '0')}`;
    const agentsDir = path.join(projectPath, '.claude', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    const agentData = {
      name: agentName,
      path: path.join(agentsDir, `${agentName}.md`),
      type: this.getAgentType(index),
      complexity,
      hasCustomizations,
      includeLegacy,
      metadata: {
        created: new Date().toISOString(),
        version: includeLegacy ? '1.0.0' : '2.1.0',
        checksum: null,
        size: 0
      }
    };

    // Generate agent content based on complexity and type
    let content = await this.generateAgentContent(agentData);

    // Add customizations if requested
    if (hasCustomizations) {
      content += await this.generateCustomizations(agentData);
    }

    // Add legacy content if requested
    if (includeLegacy) {
      content += await this.generateLegacyContent(agentData);
    }

    // Write file and update metadata
    await fs.writeFile(agentData.path, content, 'utf-8');
    const stats = await fs.stat(agentData.path);
    agentData.metadata.size = stats.size;
    agentData.metadata.checksum = this.calculateChecksum(content);

    this.generatedFiles.push(agentData.path);
    return agentData;
  }

  /**
   * Generate hook configuration file
   */
  async generateHook(projectPath, options = {}) {
    const {
      index = 0,
      hasCustomizations = false,
      complexity = 'medium'
    } = options;

    const hookTypes = ['pre-commit', 'post-merge', 'pre-push', 'post-update', 'validation'];
    const hookType = hookTypes[index % hookTypes.length];
    const hookName = `${hookType}-${index.toString().padStart(2, '0')}`;
    
    const hooksDir = path.join(projectPath, '.claude', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true });

    const hookData = {
      name: hookName,
      path: path.join(hooksDir, `${hookName}.yml`),
      type: hookType,
      complexity,
      hasCustomizations,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        checksum: null,
        size: 0
      }
    };

    // Generate hook configuration
    const content = await this.generateHookContent(hookData);

    // Write file and update metadata
    await fs.writeFile(hookData.path, content, 'utf-8');
    const stats = await fs.stat(hookData.path);
    hookData.metadata.size = stats.size;
    hookData.metadata.checksum = this.calculateChecksum(content);

    this.generatedFiles.push(hookData.path);
    return hookData;
  }

  /**
   * Generate registry files with realistic metadata
   */
  async generateRegistry(projectPath, projectData) {
    const registryDir = path.join(projectPath, '.automagik-genie', 'registry');
    await fs.mkdir(registryDir, { recursive: true });

    const registry = {
      agents: path.join(registryDir, 'agents.json'),
      hooks: path.join(registryDir, 'hooks.json'),
      system: path.join(registryDir, 'system.json')
    };

    // Generate agent registry
    const agentRegistry = {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      agents: {}
    };

    for (const agent of projectData.agents) {
      agentRegistry.agents[agent.name] = {
        path: path.relative(projectPath, agent.path),
        checksum: agent.metadata.checksum,
        size: agent.metadata.size,
        version: agent.metadata.version,
        lastModified: agent.metadata.created,
        hasCustomizations: agent.hasCustomizations,
        complexity: agent.complexity
      };
    }

    await fs.writeFile(registry.agents, JSON.stringify(agentRegistry, null, 2));

    // Generate hook registry
    const hookRegistry = {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      hooks: {}
    };

    for (const hook of projectData.hooks) {
      hookRegistry.hooks[hook.name] = {
        path: path.relative(projectPath, hook.path),
        checksum: hook.metadata.checksum,
        size: hook.metadata.size,
        type: hook.type,
        lastModified: hook.metadata.created
      };
    }

    await fs.writeFile(registry.hooks, JSON.stringify(hookRegistry, null, 2));

    // Generate system registry
    const systemRegistry = {
      installedVersion: '2.1.0',
      lastUpdateCheck: new Date().toISOString(),
      projectInitialized: projectData.metadata.created,
      updateHistory: [
        {
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fromVersion: '1.0.0',
          toVersion: '2.0.0',
          success: true,
          filesUpdated: Math.floor(projectData.agents.length * 0.7)
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          fromVersion: '2.0.0',
          toVersion: '2.1.0',
          success: true,
          filesUpdated: Math.floor(projectData.agents.length * 0.3)
        }
      ],
      statistics: {
        totalUpdates: 2,
        successfulUpdates: 2,
        failedUpdates: 0,
        averageUpdateTime: '45s',
        lastBackupSize: this.calculateTotalSize(projectData)
      }
    };

    await fs.writeFile(registry.system, JSON.stringify(systemRegistry, null, 2));

    this.generatedFiles.push(registry.agents, registry.hooks, registry.system);
    return registry;
  }

  /**
   * Generate backup structures with various states
   */
  async generateBackups(projectPath, projectData) {
    const backupDir = path.join(projectPath, '.automagik-genie', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const backups = [];

    // Generate 3-5 backups with different characteristics
    const backupCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < backupCount; i++) {
      const backupTimestamp = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const backupName = `backup-${backupTimestamp.toISOString().replace(/[:.]/g, '-')}`;
      const backupPath = path.join(backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });

      const backup = {
        id: backupName,
        path: backupPath,
        timestamp: backupTimestamp.toISOString(),
        type: i === 0 ? 'pre-update-backup' : 'manual-backup',
        fileCount: 0,
        totalSize: 0,
        valid: i < backupCount - 1, // Last backup is corrupted for testing
        manifest: path.join(backupPath, 'manifest.json')
      };

      // Create backup files (subset of project files)
      const filesToBackup = projectData.agents.slice(0, Math.floor(projectData.agents.length * 0.8));
      const filesDir = path.join(backupPath, 'files');
      await fs.mkdir(filesDir, { recursive: true });

      const manifestFiles = [];

      for (const agent of filesToBackup) {
        const relativePath = path.relative(projectPath, agent.path);
        const backupFilePath = path.join(filesDir, relativePath);
        
        await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
        
        // Copy file content (with potential corruption for testing)
        let content = await fs.readFile(agent.path, 'utf-8');
        if (!backup.valid && Math.random() < 0.3) {
          // Corrupt some files in invalid backup
          content = content.substring(0, Math.floor(content.length * 0.7)) + '\n<!-- CORRUPTED -->';
        }
        
        await fs.writeFile(backupFilePath, content, 'utf-8');
        const stats = await fs.stat(backupFilePath);
        
        manifestFiles.push({
          originalPath: agent.path,
          backupPath: backupFilePath,
          relativePath,
          size: stats.size,
          modified: agent.metadata.created,
          checksum: this.calculateChecksum(content)
        });

        backup.fileCount++;
        backup.totalSize += stats.size;
      }

      // Create manifest
      const manifest = {
        id: backup.id,
        timestamp: backup.timestamp,
        metadata: {
          type: backup.type,
          description: `Backup created on ${backupTimestamp.toDateString()}`
        },
        files: manifestFiles,
        totalSize: backup.totalSize,
        fileCount: backup.fileCount,
        status: backup.valid ? 'completed' : 'corrupted'
      };

      await fs.writeFile(backup.manifest, JSON.stringify(manifest, null, 2));
      this.generatedFiles.push(backup.manifest);

      backups.push(backup);
    }

    return backups;
  }

  /**
   * Generate agent content based on type and complexity
   */
  async generateAgentContent(agentData) {
    const templates = {
      dev: () => this.generateDeveloperAgentContent(agentData),
      testing: () => this.generateTestingAgentContent(agentData),
      quality: () => this.generateQualityAgentContent(agentData),
      analyzer: () => this.generateAnalyzerAgentContent(agentData),
      generic: () => this.generateGenericAgentContent(agentData)
    };

    const contentGenerator = templates[agentData.type] || templates.generic;
    return await contentGenerator();
  }

  /**
   * Generate developer agent content
   */
  generateDeveloperAgentContent(agentData) {
    return `# ${agentData.name.charAt(0).toUpperCase() + agentData.name.slice(1)} Agent

## Role
Advanced development agent specialized in code generation and software engineering tasks.

## Core Instructions
- Write clean, maintainable, and well-documented code
- Follow established coding standards and best practices
- Implement proper error handling and validation
- Use modern development patterns and frameworks

### Development Capabilities
\`\`\`javascript
class DevelopmentAgent {
  constructor() {
    this.languages = ['javascript', 'python', 'java', 'go', 'rust'];
    this.frameworks = ['react', 'vue', 'angular', 'express', 'fastapi'];
    this.databases = ['postgresql', 'mongodb', 'redis', 'elasticsearch'];
  }
  
  async generateCode(requirements, language, framework) {
    // Validate requirements
    if (!this.validateRequirements(requirements)) {
      throw new Error('Invalid requirements specification');
    }
    
    // Select appropriate patterns
    const patterns = this.selectPatterns(language, framework);
    
    // Generate code structure
    const codeStructure = await this.createCodeStructure(requirements, patterns);
    
    // Implement business logic
    const implementation = await this.implementLogic(codeStructure, requirements);
    
    // Add testing and documentation
    return this.finalizeCode(implementation);
  }
  
  validateRequirements(requirements) {
    return requirements && 
           requirements.functionality && 
           requirements.constraints &&
           requirements.acceptance_criteria;
  }
  
  selectPatterns(language, framework) {
    const patterns = {
      architectural: this.getArchitecturalPatterns(framework),
      design: this.getDesignPatterns(language),
      testing: this.getTestingPatterns(language, framework)
    };
    
    return patterns;
  }
}
\`\`\`

### Code Quality Standards
- **Complexity**: Maximum cyclomatic complexity of 10
- **Coverage**: Minimum 85% test coverage
- **Documentation**: All public APIs must be documented
- **Security**: Input validation and sanitization required
- **Performance**: Response times under 200ms for API endpoints

### Integration Protocols
\`\`\`yaml
integration_settings:
  version_control:
    system: "git"
    branch_strategy: "gitflow"
    commit_message_format: "type(scope): description"
  
  ci_cd:
    pipeline: "github_actions"
    stages: ["lint", "test", "build", "deploy"]
    quality_gates:
      - coverage: ">= 80%"
      - security_scan: "passing"
      - performance_tests: "passing"
  
  deployment:
    strategy: "blue_green"
    monitoring:
      - health_checks: true
      - performance_metrics: true
      - error_tracking: true
\`\`\`

## Advanced Features

### AI-Assisted Development
\`\`\`python
class AIAssistedDevelopment:
    def __init__(self):
        self.ai_models = {
            'code_completion': 'codex-davinci-002',
            'bug_detection': 'static-analysis-model',
            'performance_optimization': 'performance-analyzer'
        }
    
    async def analyze_code_quality(self, source_code):
        """Analyze code quality using AI models"""
        results = {}
        
        # Check for potential bugs
        bugs = await self.detect_bugs(source_code)
        results['potential_bugs'] = bugs
        
        # Analyze performance patterns
        performance = await self.analyze_performance(source_code)
        results['performance_issues'] = performance
        
        # Suggest improvements
        improvements = await self.suggest_improvements(source_code)
        results['improvement_suggestions'] = improvements
        
        return results
    
    async def generate_tests(self, source_code, test_type='unit'):
        """Generate comprehensive test suites"""
        test_cases = []
        
        # Analyze code structure
        functions = self.extract_functions(source_code)
        classes = self.extract_classes(source_code)
        
        # Generate unit tests
        for func in functions:
            test_case = await self.generate_function_tests(func)
            test_cases.append(test_case)
        
        # Generate integration tests if requested
        if test_type in ['integration', 'all']:
            integration_tests = await self.generate_integration_tests(classes)
            test_cases.extend(integration_tests)
        
        return test_cases
\`\`\`

### Deployment Automation
\`\`\`bash
#!/bin/bash
# Automated deployment script with safety checks

set -euo pipefail

readonly DEPLOYMENT_ENV="\${1:-staging}"
readonly APP_VERSION="\${2:-latest}"
readonly HEALTH_CHECK_TIMEOUT=300

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

validate_deployment() {
    log "Validating deployment configuration..."
    
    # Check environment
    if [[ ! "$DEPLOYMENT_ENV" =~ ^(staging|production)$ ]]; then
        log "ERROR: Invalid environment: $DEPLOYMENT_ENV"
        exit 1
    fi
    
    # Verify version exists
    if ! docker image inspect "app:$APP_VERSION" > /dev/null 2>&1; then
        log "ERROR: Docker image app:$APP_VERSION not found"
        exit 1
    fi
    
    log "Deployment validation passed"
}

deploy() {
    log "Starting deployment to $DEPLOYMENT_ENV..."
    
    # Blue-green deployment
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        deploy_blue_green
    else
        deploy_direct
    fi
    
    # Health checks
    if perform_health_checks; then
        log "Deployment successful"
        send_notification "success"
    else
        log "Health checks failed, rolling back..."
        rollback_deployment
        send_notification "failure"
        exit 1
    fi
}

main() {
    validate_deployment
    deploy
}

main "$@"
\`\`\`

## Monitoring and Observability

### Performance Metrics
- **Response Time**: P95 < 200ms, P99 < 500ms
- **Throughput**: > 1000 requests/second
- **Error Rate**: < 0.1%
- **Availability**: > 99.9% uptime

### Logging Strategy
\`\`\`json
{
  "logging": {
    "level": "info",
    "format": "structured",
    "fields": {
      "timestamp": "ISO8601",
      "level": "string",
      "message": "string",
      "service": "string",
      "version": "string",
      "trace_id": "string",
      "user_id": "string",
      "request_id": "string"
    },
    "destinations": [
      {
        "type": "console",
        "enabled": true
      },
      {
        "type": "file",
        "enabled": true,
        "path": "/var/log/app.log",
        "rotation": "24h"
      },
      {
        "type": "elasticsearch",
        "enabled": true,
        "index": "app-logs-{date}"
      }
    ]
  }
}
\`\`\`
`;
  }

  /**
   * Generate testing agent content
   */
  generateTestingAgentContent(agentData) {
    return `# ${agentData.name.charAt(0).toUpperCase() + agentData.name.slice(1)} Agent

## Role
Comprehensive testing agent specialized in test automation and quality assurance.

## Core Instructions
- Create thorough test suites with high coverage
- Implement various testing strategies (unit, integration, e2e)
- Ensure test reliability and maintainability
- Provide detailed test reporting and analysis

### Testing Framework Integration
\`\`\`javascript
class TestingFramework {
  constructor() {
    this.frameworks = {
      unit: ['jest', 'mocha', 'vitest'],
      integration: ['supertest', 'testcontainers'],
      e2e: ['playwright', 'cypress', 'selenium'],
      performance: ['k6', 'artillery', 'jmeter']
    };
    this.reporters = ['json', 'html', 'junit', 'coverage'];
  }
  
  async runTestSuite(testType, options = {}) {
    const {
      pattern = '**/*.test.js',
      coverage = true,
      parallel = true,
      timeout = 30000
    } = options;
    
    const config = this.buildTestConfig(testType, {
      pattern,
      coverage,
      parallel,
      timeout
    });
    
    const results = await this.executeTests(config);
    
    if (coverage) {
      await this.generateCoverageReport(results);
    }
    
    return this.formatResults(results);
  }
  
  async generateTestCases(sourceCode, testType = 'unit') {
    // Analyze source code structure
    const analysis = await this.analyzeCode(sourceCode);
    
    // Generate test cases based on analysis
    const testCases = [];
    
    for (const func of analysis.functions) {
      // Happy path tests
      testCases.push(this.generateHappyPathTest(func));
      
      // Edge case tests
      testCases.push(...this.generateEdgeCaseTests(func));
      
      // Error condition tests
      testCases.push(...this.generateErrorTests(func));
    }
    
    return testCases;
  }
}
\`\`\`

### Test Data Management
\`\`\`python
class TestDataManager:
    def __init__(self):
        self.data_generators = {
            'user': self.generate_user_data,
            'product': self.generate_product_data,
            'order': self.generate_order_data,
            'payment': self.generate_payment_data
        }
        self.fixtures_path = './tests/fixtures'
    
    def generate_test_data(self, entity_type, count=10, **kwargs):
        """Generate realistic test data for specified entity type"""
        if entity_type not in self.data_generators:
            raise ValueError(f"Unknown entity type: {entity_type}")
        
        generator = self.data_generators[entity_type]
        data = []
        
        for i in range(count):
            entity = generator(index=i, **kwargs)
            data.append(entity)
        
        return data
    
    def generate_user_data(self, index=0, **kwargs):
        """Generate realistic user test data"""
        import faker
        fake = faker.Faker()
        
        return {
            'id': f'user_{index:04d}',
            'email': fake.email(),
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'age': fake.random_int(min=18, max=80),
            'country': fake.country(),
            'created_at': fake.date_time_between(start_date='-2y', end_date='now'),
            'is_active': fake.boolean(chance_of_getting_true=85),
            'preferences': {
                'newsletter': fake.boolean(),
                'notifications': fake.boolean(),
                'language': fake.random_element(['en', 'es', 'fr', 'de'])
            }
        }
    
    async def create_test_database(self, schema_path, data_sets):
        """Create isolated test database with test data"""
        # Create test database
        test_db = await self.create_isolated_database()
        
        # Apply schema
        await test_db.execute_schema(schema_path)
        
        # Insert test data
        for table_name, data in data_sets.items():
            await test_db.insert_batch(table_name, data)
        
        return test_db
\`\`\`

### Performance Testing
\`\`\`yaml
performance_testing:
  load_tests:
    scenarios:
      - name: "normal_load"
        users: 100
        duration: "5m"
        ramp_up: "1m"
        
      - name: "peak_load"
        users: 500
        duration: "10m"
        ramp_up: "2m"
        
      - name: "stress_test"
        users: 1000
        duration: "15m"
        ramp_up: "5m"
  
  thresholds:
    response_time:
      p95: "200ms"
      p99: "500ms"
    error_rate: "< 1%"
    throughput: "> 100 req/s"
  
  monitoring:
    metrics:
      - "response_time"
      - "error_rate"  
      - "throughput"
      - "cpu_usage"
      - "memory_usage"
    
    alerts:
      - condition: "error_rate > 1%"
        action: "stop_test"
      - condition: "response_time_p95 > 500ms"
        action: "alert_team"
\`\`\`
`;
  }

  /**
   * Generate customization content for agents
   */
  async generateCustomizations(agentData) {
    const customizationTypes = [
      'business_logic',
      'api_integrations', 
      'data_processing',
      'workflow_automation',
      'monitoring_alerts'
    ];

    const customType = customizationTypes[Math.floor(Math.random() * customizationTypes.length)];
    
    return `

<!-- USER_CUSTOMIZATION_START -->
## Custom ${customType.replace('_', ' ').toUpperCase()} Implementation

### Proprietary Business Logic
\`\`\`javascript
class ProprietaryProcessor {
  constructor() {
    this.apiKey = process.env.PROPRIETARY_API_KEY;
    this.endpoint = 'https://internal-api.company.com/v2';
    this.timeout = 30000;
  }
  
  async processCustomWorkflow(data) {
    // CRITICAL: This logic is proprietary - DO NOT MODIFY
    const validation = await this.validateBusinessRules(data);
    if (!validation.valid) {
      throw new Error(\`Business rule violation: \${validation.errors.join(', ')}\`);
    }
    
    const result = await this.executeProprietaryAlgorithm(data);
    await this.auditLog(data, result);
    
    return result;
  }
  
  async validateBusinessRules(data) {
    // Custom validation logic specific to company requirements
    const rules = [
      this.validateCustomerTier(data.customer),
      this.validateComplianceRequirements(data),
      this.validateBusinessConstraints(data)
    ];
    
    const results = await Promise.all(rules);
    const failures = results.filter(r => !r.valid);
    
    return {
      valid: failures.length === 0,
      errors: failures.map(f => f.error)
    };
  }
}
\`\`\`

### Integration Configuration
\`\`\`yaml
custom_integrations:
  crm_system:
    endpoint: "https://crm.company.com/api/v3"
    authentication:
      type: "oauth2"
      client_id: "\${CRM_CLIENT_ID}"
      client_secret: "\${CRM_CLIENT_SECRET}"
    
  payment_gateway:
    provider: "stripe_enterprise"
    webhook_endpoints:
      - "/webhooks/payment/success"
      - "/webhooks/payment/failure"
    supported_currencies: ["USD", "EUR", "GBP"]
    
  notification_service:
    email:
      provider: "sendgrid"
      template_ids:
        welcome: "d-123456789"
        invoice: "d-987654321"
    sms:
      provider: "twilio"
      from_number: "+1234567890"
\`\`\`

### Custom Monitoring and Alerts
\`\`\`python
class CustomMonitoring:
    def __init__(self):
        self.alert_channels = {
            'slack': os.getenv('SLACK_WEBHOOK_URL'),
            'email': os.getenv('ALERT_EMAIL_LIST'),
            'pagerduty': os.getenv('PAGERDUTY_INTEGRATION_KEY')
        }
    
    async def track_business_metric(self, metric_name, value, tags=None):
        """Track custom business metrics"""
        tags = tags or {}
        tags.update({
            'environment': os.getenv('ENVIRONMENT'),
            'service': 'custom-processor',
            'version': os.getenv('APP_VERSION')
        })
        
        # Send to custom metrics endpoint
        await self.send_metric({
            'name': metric_name,
            'value': value,
            'timestamp': datetime.utcnow().isoformat(),
            'tags': tags
        })
        
        # Check for alert conditions
        if self.should_alert(metric_name, value):
            await self.send_alert(metric_name, value, tags)
    
    def should_alert(self, metric_name, value):
        """Custom alerting logic based on business rules"""
        alert_rules = {
            'revenue_drop': lambda v: v < 0.9 * self.get_baseline('revenue'),
            'error_rate_spike': lambda v: v > 0.05,
            'response_time_high': lambda v: v > 2000,
            'queue_backup': lambda v: v > 1000
        }
        
        rule = alert_rules.get(metric_name)
        return rule and rule(value)
\`\`\`
<!-- USER_CUSTOMIZATION_END -->`;
  }

  /**
   * Generate legacy content for backward compatibility testing
   */
  async generateLegacyContent(agentData) {
    return `

<!-- LEGACY_SECTION_START -->
## Legacy Configuration (Deprecated)

### Old API Integration (v1.0)
\`\`\`javascript
// DEPRECATED: This API version will be removed in v3.0
const legacyAPI = {
  endpoint: 'https://api-v1.company.com',
  authentication: 'basic', // Should migrate to OAuth2
  timeout: 60000,
  
  async makeRequest(path, data) {
    // Legacy request handling
    const response = await fetch(\`\${this.endpoint}\${path}\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Basic \${btoa('user:pass')}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
};
\`\`\`

### Deprecated Configuration Format
\`\`\`yaml
# DEPRECATED: Use new configuration format in v2.0+
legacy_config:
  database:
    host: "localhost"
    port: 5432
    username: "app_user"
    password: "plain_text_password"  # Security issue: use encrypted passwords
  
  cache:
    type: "redis"
    url: "redis://localhost:6379"
    ttl: 3600
\`\`\`
<!-- LEGACY_SECTION_END -->`;
  }

  /**
   * Generate hook configuration content
   */
  async generateHookContent(hookData) {
    const hookTemplates = {
      'pre-commit': () => `# Pre-commit Hook Configuration
name: "${hookData.name}"
version: "1.0.0"
trigger: "pre-commit"

validations:
  - name: "lint_check"
    command: "npm run lint"
    required: true
    
  - name: "type_check"
    command: "npm run typecheck"
    required: true
    
  - name: "test_check"
    command: "npm run test:changed"
    required: false

formatting:
  - name: "prettier"
    command: "npx prettier --write"
    patterns: ["*.js", "*.ts", "*.json"]
    
  - name: "eslint_fix"
    command: "npx eslint --fix"
    patterns: ["*.js", "*.ts"]

notifications:
  on_success:
    message: "Pre-commit checks passed ✅"
  on_failure:  
    message: "Pre-commit checks failed ❌"
    channels: ["console", "slack"]`,

      'post-merge': () => `# Post-merge Hook Configuration
name: "${hookData.name}"
version: "1.0.0"
trigger: "post-merge"

dependencies:
  - name: "npm_install"
    command: "npm ci"
    condition: "package-lock.json changed"
    
  - name: "database_migrate"
    command: "npm run db:migrate"
    condition: "migrations/ changed"

cache_invalidation:
  - name: "clear_build_cache"
    command: "rm -rf .next/cache"
    condition: "always"
    
  - name: "clear_node_modules_cache"
    command: "npm cache clean --force"
    condition: "package.json changed"

notifications:
  webhook:
    url: "https://hooks.slack.com/services/..."
    message: "Code merged and dependencies updated"`,

      'pre-push': () => `# Pre-push Hook Configuration  
name: "${hookData.name}"
version: "1.0.0"
trigger: "pre-push"

security_checks:
  - name: "secret_scan"
    command: "truffleHog --regex --entropy=False ."
    required: true
    
  - name: "dependency_audit"
    command: "npm audit --audit-level=moderate"
    required: true

quality_gates:
  - name: "coverage_check"
    command: "npm run test:coverage"
    threshold: 80
    required: true
    
  - name: "bundle_size_check"
    command: "npm run build:analyze"
    max_size: "1MB"
    required: false

deployment_preparation:
  - name: "build_test"
    command: "npm run build"
    required: true
    
  - name: "integration_tests"
    command: "npm run test:integration"
    required: true`,

      'post-update': () => `# Post-update Hook Configuration
name: "${hookData.name}"
version: "1.0.0"
trigger: "post-update"

validation:
  - name: "file_integrity"
    command: "shasum -c checksums.txt"
    required: true
    
  - name: "agent_validation"
    command: "node scripts/validate-agents.js"
    required: true

cleanup:
  - name: "temp_files"
    command: "find . -name '*.tmp' -delete"
    
  - name: "old_backups"
    command: "find backups/ -mtime +30 -delete"

notifications:
  email:
    to: "admin@company.com"
    subject: "System update completed"
  slack:
    channel: "#updates"
    message: "Automagik Genie updated successfully"`
    };

    const generator = hookTemplates[hookData.type] || hookTemplates['post-update'];
    return generator();
  }

  /**
   * Generate project metadata file
   */
  async generateProjectMetadata(projectPath, projectData) {
    const metadata = {
      project: {
        name: projectData.name,
        version: '2.1.0',
        created: projectData.metadata.created,
        lastUpdated: new Date().toISOString(),
        complexity: projectData.metadata.complexity
      },
      statistics: {
        totalAgents: projectData.agents.length,
        totalHooks: projectData.hooks.length,
        totalSize: this.calculateTotalSize(projectData),
        customizedAgents: projectData.agents.filter(a => a.hasCustomizations).length,
        legacyAgents: projectData.agents.filter(a => a.includeLegacy).length
      },
      structure: {
        agentsDirectory: '.claude/agents',
        hooksDirectory: '.claude/hooks',
        registryDirectory: '.automagik-genie/registry',
        backupsDirectory: '.automagik-genie/backups'
      },
      testingMetadata: {
        generatedBy: 'TestDataGenerator',
        generatedAt: new Date().toISOString(),
        purpose: 'Comprehensive update system testing',
        categories: [
          'real-world-data',
          'stress-testing', 
          'security-testing',
          'network-failure-testing'
        ]
      }
    };

    const metadataPath = path.join(projectPath, 'project-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    this.generatedFiles.push(metadataPath);

    return metadata;
  }

  /**
   * Generate performance test datasets
   */
  async generatePerformanceDataset(options = {}) {
    const {
      name = 'performance-dataset',
      agentCounts = [10, 50, 100, 500],
      complexities = ['low', 'medium', 'high'],
      includeCorrupted = true
    } = options;

    console.log('🏃 Generating performance test datasets...');

    const datasets = [];

    for (const agentCount of agentCounts) {
      for (const complexity of complexities) {
        const datasetName = `${name}-${agentCount}-agents-${complexity}`;
        
        console.log(`📊 Creating dataset: ${datasetName}`);
        
        const dataset = await this.generateProject({
          name: datasetName,
          agentCount,
          hookCount: Math.ceil(agentCount / 10),
          complexity,
          hasCustomizations: true,
          includeBackups: true,
          includeRegistry: true
        });

        datasets.push(dataset);
      }
    }

    // Generate corrupted dataset for error handling testing
    if (includeCorrupted) {
      console.log('💀 Creating corrupted dataset...');
      
      const corruptedDataset = await this.generateProject({
        name: `${name}-corrupted`,
        agentCount: 20,
        hookCount: 5,
        complexity: 'medium',
        hasCustomizations: true,
        includeBackups: false,
        includeRegistry: false
      });

      // Corrupt some files
      await this.introduceCorruption(corruptedDataset);
      datasets.push(corruptedDataset);
    }

    return datasets;
  }

  /**
   * Introduce corruption for testing error handling
   */
  async introduceCorruption(projectData) {
    console.log('💀 Introducing corruption for error handling tests...');

    // Corrupt random agent files
    const agentsToCorrupt = projectData.agents.slice(0, 3);
    
    for (const agent of agentsToCorrupt) {
      const content = await fs.readFile(agent.path, 'utf-8');
      const corruptedContent = content.substring(0, Math.floor(content.length * 0.7)) + '\n<!-- FILE_CORRUPTED -->';
      await fs.writeFile(agent.path, corruptedContent, 'utf-8');
      
      console.log(`💀 Corrupted: ${agent.name}`);
    }

    // Create invalid JSON files
    const invalidRegistryPath = path.join(projectData.path, '.automagik-genie', 'registry', 'invalid.json');
    await fs.mkdir(path.dirname(invalidRegistryPath), { recursive: true });
    await fs.writeFile(invalidRegistryPath, '{ invalid json content }', 'utf-8');

    // Create files with permission issues (if on Unix)
    if (process.platform !== 'win32') {
      const restrictedFile = path.join(projectData.path, 'restricted-file.md');
      await fs.writeFile(restrictedFile, 'Restricted content', 'utf-8');
      await fs.chmod(restrictedFile, 0o000); // No permissions
    }
  }

  /**
   * Cleanup generated test data
   */
  async cleanup() {
    if (this.baseDir) {
      console.log(`🧹 Cleaning up test data: ${this.baseDir}`);
      
      try {
        await fs.rmdir(this.baseDir, { recursive: true });
        console.log('✅ Cleanup completed');
      } catch (error) {
        console.warn(`⚠️ Cleanup warning: ${error.message}`);
      }
    }

    this.projectStructures.clear();
    this.generatedFiles = [];
  }

  // Helper methods

  getAgentType(index) {
    const types = ['dev', 'testing', 'quality', 'analyzer'];
    return types[index % types.length];
  }

  getVariedComplexity(baseComplexity, index) {
    const complexities = ['low', 'medium', 'high'];
    const baseIndex = complexities.indexOf(baseComplexity);
    const variation = [-1, 0, 1][index % 3];
    const newIndex = Math.max(0, Math.min(2, baseIndex + variation));
    return complexities[newIndex];
  }

  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  calculateTotalSize(projectData) {
    return projectData.agents.reduce((sum, agent) => sum + agent.metadata.size, 0) +
           projectData.hooks.reduce((sum, hook) => sum + hook.metadata.size, 0);
  }

  generateGenericAgentContent(agentData) {
    return `# ${agentData.name.charAt(0).toUpperCase() + agentData.name.slice(1)} Agent

## Role
Generic agent for ${agentData.complexity} complexity tasks.

## Instructions
- Handle assigned tasks efficiently
- Maintain quality standards
- Provide appropriate feedback
- Follow established protocols

### Basic Configuration
\`\`\`json
{
  "agent_id": "${agentData.name}",
  "complexity": "${agentData.complexity}",
  "version": "${agentData.metadata.version}",
  "capabilities": [
    "task_processing",
    "data_validation", 
    "error_handling"
  ]
}
\`\`\`
`;
  }

  generateQualityAgentContent(agentData) {
    return `# ${agentData.name.charAt(0).toUpperCase() + agentData.name.slice(1)} Agent

## Role
Quality assurance agent for code quality and standards enforcement.

## Instructions
- Enforce coding standards and best practices
- Perform code quality analysis
- Generate quality reports
- Monitor compliance metrics

### Quality Checks
\`\`\`python
class QualityAssurance:
    def __init__(self):
        self.quality_rules = [
            'check_complexity',
            'validate_naming',
            'ensure_documentation',
            'verify_tests'
        ]
    
    def analyze_quality(self, source_code):
        results = {}
        for rule in self.quality_rules:
            results[rule] = self.apply_rule(rule, source_code)
        return results
\`\`\`
`;
  }

  generateAnalyzerAgentContent(agentData) {
    return `# ${agentData.name.charAt(0).toUpperCase() + agentData.name.slice(1)} Agent

## Role
Code analysis agent for pattern detection and architectural insights.

## Instructions
- Analyze code patterns and structures
- Detect architectural issues
- Provide optimization recommendations
- Generate analysis reports

### Analysis Framework
\`\`\`javascript
class CodeAnalyzer {
  analyze(codebase) {
    return {
      patterns: this.detectPatterns(codebase),
      metrics: this.calculateMetrics(codebase),
      issues: this.findIssues(codebase),
      recommendations: this.generateRecommendations(codebase)
    };
  }
}
\`\`\`
`;
  }
}

module.exports = { TestDataGenerator };