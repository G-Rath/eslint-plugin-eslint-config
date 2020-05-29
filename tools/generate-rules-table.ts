#!/usr/bin/env ts-node-transpile-only

/* eslint-disable no-sync */

import { TSESLint } from '@typescript-eslint/experimental-utils';
import * as fs from 'fs';
import * as path from 'path';
import prettier from 'prettier';
import plugin from '../src';

interface RuleDetails {
  name: string;
  description: string;
  fixable: boolean;
  recommended: boolean;
}

type RuleModule = TSESLint.RuleModule<string, unknown[]>;

const requireRule = (name: string): RuleModule =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports,global-require
  require(`../src/rules/${name}`) as RuleModule;

const staticElements = {
  listHeaderRow: ['Rule', 'Description', 'Configurations', 'Fixable'],
  listSpacerRow: Array<string>(5).fill('-')
};

const buildRuleRow = (rule: RuleDetails): string[] => [
  `[${rule.name}](docs/rules/${rule.name}.md)`,
  rule.description,
  rule.recommended ? '![recommended][]' : '',
  rule.fixable ? '![fixable][]' : ''
];

const generateRulesListMarkdown = (details: RuleDetails[]): string =>
  [
    staticElements.listHeaderRow,
    staticElements.listSpacerRow,
    ...details
      .sort(({ name: a }, { name: b }) => a.localeCompare(b))
      .map(buildRuleRow)
  ]
    .map(column => [...column, ' '].join('|'))
    .join('\n');

const updateRulesList = (details: RuleDetails[], markdown: string): string => {
  const listBeginMarker = `<!-- begin rules list -->`;
  const listEndMarker = `<!-- end rules list -->`;

  const listStartIndex = markdown.indexOf(listBeginMarker);
  const listEndIndex = markdown.indexOf(listEndMarker);

  if (listStartIndex === -1 || listEndIndex === -1) {
    throw new Error(`cannot find start or end of rules list`);
  }

  return [
    markdown.substring(0, listStartIndex - 1),
    listBeginMarker,
    '',
    generateRulesListMarkdown(details),
    '',
    markdown.substring(listEndIndex)
  ].join('\n');
};

const details: RuleDetails[] = Object.keys(plugin.configs.all.rules)
  .map(name => name.split('/')[1])
  .map(name => [name, requireRule(name)] as const)
  .filter(
    (nameAndRule): nameAndRule is [string, RuleModule] =>
      !nameAndRule[1].meta.deprecated
  )
  .map(
    ([name, rule]): RuleDetails => ({
      name,
      description: rule.meta.docs?.description ?? '',
      fixable: !!rule.meta.fixable,
      recommended: !!rule.meta.docs?.recommended
    })
  );

let readme = fs.readFileSync(path.resolve(__dirname, '../README.md'), 'utf8');

readme = updateRulesList(details, readme);

readme = prettier.format(readme, { parser: 'markdown' });

fs.writeFileSync(path.resolve(__dirname, '../README.md'), readme, 'utf8');
