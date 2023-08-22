import React, { FunctionComponent, useState } from 'react';
import { graphql, PreloadedQuery, usePreloadedQuery } from 'react-relay';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import {
  ExpandLessOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import useQueryLoading from '../hooks/useQueryLoading';
import Loader, { LoaderVariant } from '../../components/Loader';
import { useFormatter } from '../../components/i18n';
import ExpandableMarkdown from '../../components/ExpandableMarkdown';
import ItemMarkings from '../../components/ItemMarkings';
import ItemAuthor from '../../components/ItemAuthor';
import ItemConfidence from '../../components/ItemConfidence';
import type { SelectedEntity } from './EntitiesDetailsRightBar';
import ErrorNotFound from '../../components/ErrorNotFound';
import RelationShipFromAndTo from './RelationShipFromAndTo';
import { Theme } from '../../components/Theme';
import ItemIcon from '../../components/ItemIcon';
import { hexToRGB, itemColor } from '../Colors';
import ItemCreator from '../../components/ItemCreator';
import { RelationshipDetailsQuery } from './__generated__/RelationshipDetailsQuery.graphql';

const useStyles = makeStyles<Theme>((theme) => ({
  label: {
    marginTop: '20px',
  },
  buttonExpand: {
    position: 'relative',
    left: 0,
    bottom: 0,
    width: '100%',
    height: 25,
    color: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, .1)'
        : 'rgba(0, 0, 0, .1)',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, .2)'
          : 'rgba(0, 0, 0, .2)',
    },
  },
  bodyItem: {
    width: '100%',
    height: 20,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
  chipInList: {
    fontSize: 12,
    height: 20,
    width: 120,
    textTransform: 'uppercase',
    borderRadius: '0',
  },
  external: {
    position: 'fixed',
    bottom: 5,
    right: 5,
    color: theme.palette.text?.secondary,
  },
}));

const relationshipDetailsQuery = graphql`
  query RelationshipDetailsQuery($id: String!) {
    stixRelationship(id: $id) {
      id
      entity_type
      parent_types
      ... on StixCoreRelationship {
        description
        start_time
        stop_time
        created
        created_at
        confidence
        relationship_type
        from {
          ... on BasicObject {
            id
            entity_type
            parent_types
          }
          ... on BasicRelationship {
            id
            entity_type
            parent_types
          }
          ... on StixCoreRelationship {
            relationship_type
          }
        }
        to {
          ... on BasicObject {
            id
            entity_type
            parent_types
          }
          ... on BasicRelationship {
            id
            entity_type
            parent_types
          }
          ... on StixCoreRelationship {
            relationship_type
          }
        }
        createdBy {
          ... on Identity {
            id
            name
            entity_type
          }
        }
        creators {
          id
          name
        }
        objectMarking {
          edges {
            node {
              id
              definition_type
              definition
              x_opencti_order
              x_opencti_color
            }
          }
        }
        externalReferences {
          edges {
            node {
              id
              source_name
              url
              external_id
              description
            }
          }
        }
        reports(first: 10) {
          edges {
            node {
              id
              entity_type
              name
              description
              published
              report_types
              createdBy {
                ... on Identity {
                  id
                  name
                  entity_type
                }
              }
            }
          }
          pageInfo {
            globalCount
          }
        }
      }
      ... on StixRefRelationship {
        start_time
        stop_time
        created_at
        confidence
        relationship_type
        from {
          ... on BasicObject {
            id
            entity_type
            parent_types
          }
          ... on BasicRelationship {
            id
            entity_type
            parent_types
          }
          ... on StixCoreRelationship {
            relationship_type
          }
        }
        to {
          ... on BasicObject {
            id
            entity_type
            parent_types
          }
          ... on BasicRelationship {
            id
            entity_type
            parent_types
          }
          ... on StixCoreRelationship {
            relationship_type
          }
        }
        created_at
        creators {
          id
          name
        }
        objectMarking {
          edges {
            node {
              id
              definition_type
              definition
              x_opencti_order
              x_opencti_color
            }
          }
        }
        reports(first: 10) {
          edges {
            node {
              id
              entity_type
              name
              description
              published
              report_types
              createdBy {
                ... on Identity {
                  id
                  name
                  entity_type
                }
              }
            }
          }
          pageInfo {
            globalCount
          }
        }
      }
      ... on StixSightingRelationship {
          description
          created
          created_at
          updated_at
          confidence
          relationship_type
          first_seen
          last_seen
          from {
            ... on StixCoreObject {
              id
              parent_types
              entity_type
            }
            ... on StixCoreRelationship {
              id
              parent_types
              entity_type
              relationship_type
            }
          }
          to {
            ... on StixCoreObject {
              id
              parent_types
              entity_type
            }
            ... on StixCoreRelationship {
              id
              parent_types
              entity_type
              relationship_type
            }
          }
          createdBy {
            ... on Identity {
              id
              name
              entity_type
            }
          }
          creators {
            id
            name
          }
          objectMarking {
            edges {
              node {
                id
                definition_type
                definition
                x_opencti_order
                x_opencti_color
              }
            }
          }
          reports(first: 10) {
          edges {
            node {
              id
              entity_type
              name
              description
              published
              report_types
              createdBy {
                ... on Identity {
                  id
                  name
                  entity_type
                }
              }
            }
          }
          pageInfo {
            globalCount
          }
        }
      }
    }
  }
`;

interface RelationshipDetailsComponentProps {
  queryRef: PreloadedQuery<RelationshipDetailsQuery>;
}

const RelationshipDetailsComponent: FunctionComponent<
RelationshipDetailsComponentProps
> = ({ queryRef }) => {
  const classes = useStyles();
  const { t, fldt } = useFormatter();
  const entity = usePreloadedQuery<RelationshipDetailsQuery>(
    relationshipDetailsQuery,
    queryRef,
  );
  const { stixRelationship } = entity;
  const [expanded, setExpanded] = useState(false);
  const externalReferencesEdges = stixRelationship?.externalReferences?.edges;
  const reportsEdges = stixRelationship?.reports?.edges;
  const expandable = externalReferencesEdges
    ? externalReferencesEdges.length > 3
    : false;
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  if (!stixRelationship) {
    return <ErrorNotFound />;
  }

  const computeNotGenericDetails = () => {
    if (stixRelationship.parent_types.includes('stix-ref-relationship')) {
      return (
        <div>
          <Typography variant="h3" gutterBottom={true} className={classes.label}>
            {t('Creators')}
          </Typography>
          <div>
            {(stixRelationship.creators ?? []).map((c) => {
              return (
                <div
                  key={`creator-${c.id}`}
                  style={{ float: 'left', marginRight: '10px' }}
                >
                  <ItemCreator creator={c}/>
                </div>
              );
            })}
            <div style={{ clear: 'both' }}/>
          </div>
        </div>
      );
    }
    return (<div>
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('First seen')}
      </Typography>
      {stixRelationship.entity_type !== 'stix-sighting-relationship'
        ? fldt(stixRelationship.start_time)
        : fldt(stixRelationship.first_seen)}
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Last seen')}
      </Typography>
      {
        stixRelationship.entity_type !== 'stix-sighting-relationship'
          ? fldt(stixRelationship.stop_time)
          : fldt(stixRelationship.last_seen)
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Description')}
      </Typography>
      {
        stixRelationship.description
        && stixRelationship.description.length > 0
          ? <ExpandableMarkdown
            source={stixRelationship.description}
            limit={400}
          />
          : ('-')
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Confidence level')}
      </Typography>
      {
        stixRelationship.confidence
          ? <ItemConfidence confidence={stixRelationship.confidence} entityType="stix-core-relationship"/>
          : ('-')
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Marking')}
      </Typography>
      {
        stixRelationship.objectMarking
        && stixRelationship.objectMarking.edges.length > 0
          ? <ItemMarkings
            markingDefinitionsEdges={stixRelationship.objectMarking.edges}
            limit={2}
          />
          : ('-')
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Author')}
      </Typography>
      {
        stixRelationship.createdBy
          ? <ItemAuthor createdBy={stixRelationship.createdBy}/>
          : ('-')
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Creators')}
      </Typography>
      <div>
        {(stixRelationship.creators ?? []).map((c) => {
          return (
            <div
              key={`creator-${c.id}`}
              style={{ float: 'left', marginRight: '10px' }}
            >
              <ItemCreator creator={c}/>
            </div>
          );
        })}
        <div style={{ clear: 'both' }}/>
      </div>
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {`${t('Last')} ${
          (stixRelationship.reports?.pageInfo.globalCount ?? 0) >= 10
            ? 10
            : stixRelationship.reports?.pageInfo.globalCount
        } ${t('reports')} ${t('of')} ${
          stixRelationship.reports?.pageInfo.globalCount
        }`}
      </Typography>
      {reportsEdges && reportsEdges.length > 0
        ? (
          <List style={{ marginBottom: 0 }}>
            {reportsEdges.map((reportEdge) => {
              const report = reportEdge?.node;
              if (report) {
                return (
                  <ListItem
                    key={report.id}
                    dense={true}
                    button={true}
                    classes={{ root: classes.item }}
                    divider={true}
                    component={Link}
                    to={`/dashboard/analyses/reports/${report.id}`}
                  >
                    <ListItemIcon>
                      <ItemIcon type={report.entity_type} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Tooltip title={report.name}>
                          <div className={classes.bodyItem}>{report.name}</div>
                        </Tooltip>
                      }
                      secondary={
                        <div className={classes.bodyItem}>
                          {report.createdBy?.name ?? '-'}
                        </div>
                      }
                    />
                  </ListItem>
                );
              }
              return '';
            })}
          </List>
        )
        : ('-')
      }
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('External References')}
      </Typography>
      {externalReferencesEdges && externalReferencesEdges.length > 0 ? (
        <List style={{ marginBottom: 0 }}>
          {externalReferencesEdges
            .slice(0, expanded ? 200 : 3)
            .map((externalReference) => {
              const externalReferenceId = externalReference.node.external_id
                ? `(${externalReference.node.external_id})`
                : '';
              let externalReferenceSecondary = '';
              if (
                externalReference.node.url
                && externalReference.node.url.length > 0
              ) {
                externalReferenceSecondary = externalReference.node.url;
              } else if (
                externalReference.node.description
                && externalReference.node.description.length > 0
              ) {
                externalReferenceSecondary = externalReference.node.description;
              } else {
                externalReferenceSecondary = t('No description');
              }
              return (
                <div key={externalReference.node.id}>
                  <ListItem
                    component={Link}
                    to={`/dashboard/analyses/external_references/${externalReference.node.id}`}
                    dense={true}
                    divider={true}
                    button={true}
                  >
                    <ListItemIcon>
                      <ItemIcon type="External-Reference" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <div className={classes.bodyItem}>
                          {`${externalReference.node.source_name} ${externalReferenceId}`}
                        </div>
                      }
                      secondary={
                        <div className={classes.bodyItem}>
                          {externalReferenceSecondary}
                        </div>
                      }
                    />
                  </ListItem>
                </div>
              );
            })}
        </List>
      ) : (
        '-'
      )}
      </div>
    );
  };

  return (
    <div>
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Relation type')}
      </Typography>
      <Chip
        classes={{ root: classes.chipInList }}
        style={{
          backgroundColor: hexToRGB(
            itemColor(stixRelationship.relationship_type),
            0.08,
          ),
          color: itemColor(stixRelationship.relationship_type),
          border: `1px solid ${itemColor(
            stixRelationship.relationship_type,
          )}`,
        }}
        label={t(`relationship_${stixRelationship.relationship_type}`)}
      />
      {!stixRelationship.from?.relationship_type
        && stixRelationship.from?.id && (
          <RelationShipFromAndTo
            id={stixRelationship.from?.id}
            direction={'From'}
          />
      )}
      {stixRelationship.from?.relationship_type
        && stixRelationship.from?.id && (
          <div>
            <Typography
              variant="h3"
              gutterBottom={true}
              className={classes.label}
            >
              {t('Source')}
            </Typography>
            {stixRelationship.from?.relationship_type}
          </div>
      )}
      {!stixRelationship.to?.relationship_type
        && stixRelationship.to?.id && (
          <RelationShipFromAndTo
            id={stixRelationship.to?.id}
            direction={'To'}
          />
      )}
      {stixRelationship.to?.relationship_type
        && stixRelationship.to?.id && (
          <div>
            <Typography
              variant="h3"
              gutterBottom={true}
              className={classes.label}
            >
              {t('Target')}
            </Typography>
            {stixRelationship.to?.relationship_type}
          </div>
      )}
      <Typography variant="h3" gutterBottom={true} className={classes.label}>
        {t('Creation date')}
      </Typography>
      {fldt(stixRelationship.created_at)}
      {computeNotGenericDetails()}
      {expandable && (
        <Button
          variant="contained"
          size="small"
          onClick={handleToggleExpand}
          className={classes.buttonExpand}
        >
          {expanded ? (
            <ExpandLessOutlined fontSize="small" />
          ) : (
            <ExpandMoreOutlined fontSize="small" />
          )}
        </Button>
      )}
    </div>
  );
};

interface RelationshipDetailsProps {
  relation: SelectedEntity;
  queryRef: PreloadedQuery<RelationshipDetailsQuery>;
}

const RelationshipDetails: FunctionComponent<
Omit<RelationshipDetailsProps, 'queryRef'>
> = ({ relation }) => {
  const queryRef = useQueryLoading<RelationshipDetailsQuery>(
    relationshipDetailsQuery,
    { id: relation.id },
  );
  return queryRef ? (
    <React.Suspense fallback={<Loader variant={LoaderVariant.inElement} />}>
      <RelationshipDetailsComponent queryRef={queryRef} />
    </React.Suspense>
  ) : (
    <Loader variant={LoaderVariant.inElement} />
  );
};

export default RelationshipDetails;
