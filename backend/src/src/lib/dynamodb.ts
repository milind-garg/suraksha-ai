import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb'
import { Policy, User } from '../../types'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
})

export const docClient = DynamoDBDocumentClient.from(client)

const POLICIES_TABLE = process.env.DYNAMODB_TABLE_POLICIES || 'suraksha-ai-policies-dev'
const USERS_TABLE = process.env.DYNAMODB_TABLE_USERS || 'suraksha-ai-users-dev'

// ─── Policy Operations ────────────────────────────────

export async function createPolicy(policy: Policy) {
  await docClient.send(new PutCommand({
    TableName: POLICIES_TABLE,
    Item: policy
  }))
  return policy
}

export async function getPolicy(policyId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: POLICIES_TABLE,
    Key: { policyId }
  }))
  return result.Item
}

export async function updatePolicy(policyId: string, updates: Record<string, any>) {
  const updateExpressions: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    updateExpressions.push(`#${key} = :${key}`)
    expressionAttributeNames[`#${key}`] = key
    expressionAttributeValues[`:${key}`] = value
  })

  updateExpressions.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = new Date().toISOString()

  await docClient.send(new UpdateCommand({
    TableName: POLICIES_TABLE,
    Key: { policyId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  }))
}

export async function getUserPolicies(userId: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: POLICIES_TABLE,
    IndexName: 'userId-createdAt-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false
  }))
  return result.Items || []
}

export async function deletePolicy(policyId: string) {
  await docClient.send(new DeleteCommand({
    TableName: POLICIES_TABLE,
    Key: { policyId }
  }))
}

// ─── User Operations ──────────────────────────────────

export async function createUser(user: User) {
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: user
  }))
  return user
}

export async function getUser(userId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId }
  }))
  return result.Item
}

export async function getUserByEmail(email: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  }))
  return result.Items?.[0]
}