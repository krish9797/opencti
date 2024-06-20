import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { propOr } from 'ramda';
import { createFragmentContainer, graphql } from 'react-relay';
import withStyles from '@mui/styles/withStyles';
import { Route, Routes } from 'react-router-dom';
import StixCoreRelationship from '../../common/stix_core_relationships/StixCoreRelationship';
import { QueryRenderer } from '../../../../relay/environment';
import ContainerHeader from '../../common/containers/ContainerHeader';
import Loader, { LoaderVariant } from '../../../../components/Loader';
import AttackPatternsMatrix from '../../techniques/attack_patterns/AttackPatternsMatrix';
import { buildViewParamsFromUrlAndStorage, saveViewParameters } from '../../../../utils/ListParameters';
import { constructHandleAddFilter, constructHandleRemoveFilter, emptyFilterGroup, filtersAfterSwitchLocalMode } from '../../../../utils/filters/filtersUtils';
import CaseRfiPopover from './CaseRfiPopover';
import CaseRfiKnowledgeGraph, { caseRfiKnowledgeGraphQuery } from './CaseRfiKnowledgeGraph';
import CaseRfiKnowledgeTimeLine, { caseRfiKnowledgeTimeLineQuery } from './CaseRfiKnowledgeTimeLine';
import CaseRfiKnowledgeCorrelation, { caseRfiKnowledgeCorrelationQuery } from './CaseRfiKnowledgeCorrelation';
import ContentKnowledgeTimeLineBar from '../../common/containers/ContainertKnowledgeTimeLineBar';
import ContainerContent, { containerContentQuery } from '../../common/containers/ContainerContent';
import investigationAddFromContainer from '../../../../utils/InvestigationUtils';
import withRouter from '../../../../utils/compat-router/withRouter';

const styles = () => ({
  container: {
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
  },
});

export const caseRfiKnowledgeAttackPatternsGraphQuery = graphql`
  query CaseRfiKnowledgeAttackPatternsGraphQuery($id: String!) {
    caseRfi(id: $id) {
      id
      name
      x_opencti_graph_data
      confidence
      createdBy {
        ... on Identity {
          id
          name
          entity_type
        }
      }
      objectMarking {
        id
        definition_type
        definition
        x_opencti_order
        x_opencti_color
      }
      objects(all: true, types: ["Attack-Pattern"]) {
        edges {
          node {
            ... on AttackPattern {
              id
              entity_type
              parent_types
              name
              description
              x_mitre_platforms
              x_mitre_permissions_required
              x_mitre_id
              x_mitre_detection
              isSubAttackPattern
              parentAttackPatterns {
                edges {
                  node {
                    id
                    name
                    description
                    x_mitre_id
                  }
                }
              }
              subAttackPatterns {
                edges {
                  node {
                    id
                    name
                    description
                    x_mitre_id
                  }
                }
              }
              killChainPhases {
                id
                kill_chain_name
                phase_name
                x_opencti_order
              }
            }
          }
        }
      }
    }
  }
`;

class CaseRfiKnowledgeComponent extends Component {
  constructor(props) {
    const LOCAL_STORAGE_KEY = `case-rfis-knowledge-${props.caseData.id}`;
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.navigate,
      props.location,
      LOCAL_STORAGE_KEY,
    );
    this.state = {
      currentModeOnlyActive: propOr(false, 'currentModeOnlyActive', params),
      currentColorsReversed: propOr(false, 'currentColorsReversed', params),
      currentKillChain: propOr('mitre-attack', 'currentKillChain', params),
      timeLineDisplayRelationships: propOr(
        false,
        'timeLineDisplayRelationships',
        params,
      ),
      timeLineFunctionalDate: propOr(false, 'timeLineFunctionalDate', params),
      timeLineFilters: propOr(emptyFilterGroup, 'timeLineFilters', params),
      timeLineSearchTerm: R.propOr('', 'timeLineSearchTerm', params),
    };
  }

  saveView() {
    const LOCAL_STORAGE_KEY = `case-rfis-knowledge-${this.props.caseData.id}`;
    saveViewParameters(
      this.props.navigate,
      this.props.location,
      LOCAL_STORAGE_KEY,
      this.state,
    );
  }

  handleToggleModeOnlyActive() {
    this.setState(
      { currentModeOnlyActive: !this.state.currentModeOnlyActive },
      () => this.saveView(),
    );
  }

  handleToggleColorsReversed() {
    this.setState(
      { currentColorsReversed: !this.state.currentColorsReversed },
      () => this.saveView(),
    );
  }

  handleChangeKillChain(event) {
    const { value } = event.target;
    this.setState({ currentKillChain: value }, () => this.saveView());
  }

  handleToggleTimeLineDisplayRelationships() {
    this.setState(
      {
        timeLineDisplayRelationships: !this.state.timeLineDisplayRelationships,
      },
      () => this.saveView(),
    );
  }

  handleToggleTimeLineFunctionalDate() {
    this.setState(
      {
        timeLineFunctionalDate: !this.state.timeLineFunctionalDate,
      },
      () => this.saveView(),
    );
  }

  handleAddTimeLineFilter(filterKeysSchema, key, id, op = 'eq', event = null) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const newFilters = constructHandleAddFilter(
      this.state.timeLineFilters,
      key,
      id,
      filterKeysSchema,
      op,
    );
    this.setState(
      {
        timeLineFilters: newFilters,
      },
      () => this.saveView(),
    );
  }

  handleRemoveTimeLineFilter(key, op = 'eq') {
    const newFilters = constructHandleRemoveFilter(
      this.state.timeLineFilters,
      key,
      op,
    );
    this.setState({ timeLineFilters: newFilters }, () => this.saveView());
  }

  handleSwitchFilterLocalMode(localFilter) {
    const newFilters = filtersAfterSwitchLocalMode(this.state.timeLineFilters, localFilter);
    this.setState({ timeLineFilters: newFilters }, () => this.saveView());
  }

  handleSwitchFilterGlobalMode() {
    const newFilters = {
      ...this.state.timeLineFilters,
      mode: this.state.timeLineFilters.mode === 'and' ? 'or' : 'and',
    };
    this.setState({ timeLineFilters: newFilters }, () => this.saveView());
  }

  handleTimeLineSearch(value) {
    this.setState({ timeLineSearchTerm: value }, () => this.saveView());
  }

  render() {
    const {
      classes,
      caseData,
      location,
      params: { '*': mode },
      enableReferences,
    } = this.props;
    const {
      currentModeOnlyActive,
      currentColorsReversed,
      currentKillChain,
      timeLineFilters,
      timeLineDisplayRelationships,
      timeLineFunctionalDate,
      timeLineSearchTerm,
    } = this.state;
    const defaultTypes = timeLineDisplayRelationships
      ? ['stix-core-relationship']
      : ['Stix-Core-Object'];
    const types = R.head(timeLineFilters.filters.filter((n) => n.key === 'entity_type'))
      ?.values.length > 0
      ? []
      : defaultTypes;
    let orderBy = 'created_at';
    if (timeLineFunctionalDate && timeLineDisplayRelationships) {
      orderBy = 'start_time';
    } else if (timeLineFunctionalDate) {
      orderBy = 'created';
    }
    const timeLinePaginationOptions = {
      types,
      search: timeLineSearchTerm,
      filters: timeLineFilters,
      orderBy,
      orderMode: 'desc',
    };
    return (
      <div
        className={classes.container}
        id={location.pathname.includes('matrix') ? 'parent' : 'container'}
      >
        {mode !== 'graph' && (
        <ContainerHeader
          container={caseData}
          PopoverComponent={<CaseRfiPopover id={caseData.id}/>}
          link={`/dashboard/cases/rfis/${caseData.id}/knowledge`}
          modes={['graph', 'content', 'timeline', 'correlation', 'matrix']}
          currentMode={mode}
          knowledge={true}
          enableSuggestions={true}
          investigationAddFromContainer={investigationAddFromContainer}
        />
        )}
        <Routes>
          <Route
            path="/graph"
            element={
              <QueryRenderer
                query={caseRfiKnowledgeGraphQuery}
                variables={{ id: caseData.id }}
                render={({ props }) => {
                  if (props && props.caseRfi) {
                    return (
                      <CaseRfiKnowledgeGraph
                        caseData={props.caseRfi}
                        mode={mode}
                        enableReferences={enableReferences}
                      />
                    );
                  }
                  return (
                    <Loader
                      variant={LoaderVariant.inElement}
                      withTopMargin={true}
                    />
                  );
                }}
              />
          }
          />
          <Route
            path="/content"
            element={
              <QueryRenderer
                query={containerContentQuery}
                variables={{ id: caseData.id }}
                render={({ props }) => {
                  if (props && props.container) {
                    return <ContainerContent containerData={props.container} />;
                  }
                  return (
                    <Loader
                      variant={LoaderVariant.inElement}
                      withTopMargin={true}
                    />
                  );
                }}
              />
              }
          />
          <Route
            path="/timeline"
            element={
              <>
                <ContentKnowledgeTimeLineBar
                  handleTimeLineSearch={this.handleTimeLineSearch.bind(this)}
                  timeLineSearchTerm={timeLineSearchTerm}
                  timeLineDisplayRelationships={timeLineDisplayRelationships}
                  handleToggleTimeLineDisplayRelationships={this.handleToggleTimeLineDisplayRelationships.bind(
                    this,
                  )}
                  timeLineFunctionalDate={timeLineFunctionalDate}
                  handleToggleTimeLineFunctionalDate={this.handleToggleTimeLineFunctionalDate.bind(
                    this,
                  )}
                  timeLineFilters={timeLineFilters}
                  handleAddTimeLineFilter={this.handleAddTimeLineFilter.bind(
                    this,
                  )}
                  handleRemoveTimeLineFilter={this.handleRemoveTimeLineFilter.bind(
                    this,
                  )}
                  handleSwitchFilterLocalMode={this.handleSwitchFilterLocalMode.bind(this)}
                  handleSwitchFilterGlobalMode={this.handleSwitchFilterGlobalMode.bind(this)}
                />
                <QueryRenderer
                  query={caseRfiKnowledgeTimeLineQuery}
                  variables={{ id: caseData.id, ...timeLinePaginationOptions }}
                  render={({ props }) => {
                    if (props && props.caseRfi) {
                      return (
                        <CaseRfiKnowledgeTimeLine
                          caseData={props.caseRfi}
                          dateAttribute={orderBy}
                          displayRelationships={timeLineDisplayRelationships}
                        />
                      );
                    }
                    return (
                      <Loader
                        variant={LoaderVariant.inElement}
                        withTopMargin={true}
                      />
                    );
                  }}
                />
              </>
          }
          />
          <Route
            path="/correlation"
            element={
              <QueryRenderer
                query={caseRfiKnowledgeCorrelationQuery}
                variables={{ id: caseData.id }}
                render={({ props }) => {
                  if (props && props.caseRfi) {
                    return (
                      <CaseRfiKnowledgeCorrelation caseData={props.caseRfi} />
                    );
                  }
                  return (
                    <Loader
                      variant={LoaderVariant.inElement}
                      withTopMargin={true}
                    />
                  );
                }}
              />
          }
          />
          <Route
            path="/matrix"
            element={
              <QueryRenderer
                query={caseRfiKnowledgeAttackPatternsGraphQuery}
                variables={{ id: caseData.id }}
                render={({ props }) => {
                  if (props && props.caseRfi) {
                    const attackPatterns = R.pipe(
                      R.map((n) => n.node),
                      R.filter((n) => n.entity_type === 'Attack-Pattern'),
                    )(props.caseRfi.objects.edges);
                    return (
                      <AttackPatternsMatrix
                        entity={caseData}
                        attackPatterns={attackPatterns}
                        searchTerm=""
                        currentKillChain={currentKillChain}
                        currentModeOnlyActive={currentModeOnlyActive}
                        currentColorsReversed={currentColorsReversed}
                        handleChangeKillChain={this.handleChangeKillChain.bind(
                          this,
                        )}
                        handleToggleColorsReversed={this.handleToggleColorsReversed.bind(
                          this,
                        )}
                        handleToggleModeOnlyActive={this.handleToggleModeOnlyActive.bind(
                          this,
                        )}
                      />
                    );
                  }
                  return (
                    <Loader
                      variant={LoaderVariant.inElement}
                      withTopMargin={true}
                    />
                  );
                }}
              />
            }
          />
          <Route
            path="/relations/:relationId"
            element={
              <StixCoreRelationship
                entityId={caseData.id}
              />
            }
          />
        </Routes>
      </div>
    );
  }
}

CaseRfiKnowledgeComponent.propTypes = {
  caseData: PropTypes.object,
  mode: PropTypes.string,
  classes: PropTypes.object,
  t: PropTypes.func,
  enableReferences: PropTypes.bool,
  navigate: PropTypes.func,
};

const CaseRfiKnowledge = createFragmentContainer(CaseRfiKnowledgeComponent, {
  caseData: graphql`
    fragment CaseRfiKnowledge_case on CaseRfi {
      id
      editContext {
        name
        focusOn
      }
      ...ContainerHeader_container
    }
  `,
});

export default R.compose(withRouter, withStyles(styles))(CaseRfiKnowledge);
